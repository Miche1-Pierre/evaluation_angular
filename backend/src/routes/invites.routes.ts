import { Router, Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../types/auth.types";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/invites
 * Liste des invitations reçues par l'utilisateur connecté
 * Query params: ?status=pending|accepted|rejected (optionnel)
 */
router.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { status } = req.query;

      let query = `
        SELECT 
          si.id, si.session_id, si.inviter_id, si.invitee_id, si.status, si.created_at, si.updated_at,
          s.name as session_name, s.difficulty, s.visibility, s.status as session_status, s.max_participants,
          u.username as inviter_username, u.email as inviter_email
        FROM session_invites si
        JOIN sessions s ON s.id = si.session_id
        JOIN users u ON u.id = si.inviter_id
        WHERE si.invitee_id = $1
      `;

      const params: any[] = [userId];

      if (status && ["pending", "accepted", "rejected"].includes(status as string)) {
        query += " AND si.status = $2";
        params.push(status);
      }

      query += " ORDER BY si.created_at DESC";

      const result = await pool.query(query, params);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des invitations" });
    }
  },
);

/**
 * GET /api/invites/sent
 * Liste des invitations envoyées par l'utilisateur connecté
 */
router.get(
  "/sent",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const result = await pool.query(
        `SELECT 
          si.id, si.session_id, si.inviter_id, si.invitee_id, si.status, si.created_at, si.updated_at,
          s.name as session_name, s.difficulty, s.visibility,
          u.username as invitee_username, u.email as invitee_email
         FROM session_invites si
         JOIN sessions s ON s.id = si.session_id
         JOIN users u ON u.id = si.invitee_id
         WHERE si.inviter_id = $1
         ORDER BY si.created_at DESC`,
        [userId],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching sent invites:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des invitations envoyées" });
    }
  },
);

/**
 * POST /api/invites/:id/accept
 * Accepter une invitation
 */
router.post(
  "/:id/accept",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await client.query("BEGIN");

      // Vérifier que l'invitation existe et est pour cet utilisateur
      const inviteResult = await client.query(
        `SELECT si.*, s.status as session_status, s.max_participants
         FROM session_invites si
         JOIN sessions s ON s.id = si.session_id
         WHERE si.id = $1 AND si.invitee_id = $2`,
        [id, userId],
      );

      if (inviteResult.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Invitation non trouvée ou non autorisée" });
        return;
      }

      const invite = inviteResult.rows[0];

      if (invite.status !== "pending") {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Cette invitation a déjà été traitée" });
        return;
      }

      // Vérifier que la session n'est pas terminée
      if (invite.session_status === "completed") {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Cette session est déjà terminée" });
        return;
      }

      // Vérifier que l'utilisateur ne participe pas déjà
      const participantCheck = await client.query(
        `SELECT id FROM participants 
         WHERE session_id = $1 AND user_id = $2`,
        [invite.session_id, userId],
      );

      if (participantCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Vous participez déjà à cette session" });
        return;
      }

      // Vérifier le nombre de participants
      const participantCount = await client.query(
        `SELECT COUNT(*) as count FROM participants WHERE session_id = $1`,
        [invite.session_id],
      );

      if (
        invite.max_participants &&
        parseInt(participantCount.rows[0].count) >= invite.max_participants
      ) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "La session a atteint le nombre maximum de participants" });
        return;
      }

      // Mettre à jour le statut de l'invitation
      await client.query(
        `UPDATE session_invites 
         SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id],
      );

      // Ajouter l'utilisateur aux participants
      const participantResult = await client.query(
        `INSERT INTO participants (session_id, user_id, session_score, completed)
         VALUES ($1, $2, 0, false)
         RETURNING id, session_id, user_id, session_score, completed, created_at`,
        [invite.session_id, userId],
      );

      await client.query("COMMIT");

      res.json({
        message: "Invitation acceptée, vous avez rejoint la session",
        participant: participantResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error accepting invite:", error);
      res.status(500).json({ error: "Erreur lors de l'acceptation de l'invitation" });
    } finally {
      client.release();
    }
  },
);

/**
 * POST /api/invites/:id/reject
 * Rejeter une invitation
 */
router.post(
  "/:id/reject",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Vérifier que l'invitation existe et est pour cet utilisateur
      const inviteResult = await pool.query(
        `SELECT status FROM session_invites 
         WHERE id = $1 AND invitee_id = $2`,
        [id, userId],
      );

      if (inviteResult.rows.length === 0) {
        res.status(404).json({ error: "Invitation non trouvée ou non autorisée" });
        return;
      }

      if (inviteResult.rows[0].status !== "pending") {
        res.status(400).json({ error: "Cette invitation a déjà été traitée" });
        return;
      }

      // Mettre à jour le statut
      await pool.query(
        `UPDATE session_invites 
         SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id],
      );

      res.json({ message: "Invitation rejetée" });
    } catch (error) {
      console.error("Error rejecting invite:", error);
      res.status(500).json({ error: "Erreur lors du rejet de l'invitation" });
    }
  },
);

/**
 * DELETE /api/invites/:id
 * Annuler/supprimer une invitation
 * Accessible à l'inviter ou aux admins
 */
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Vérifier que l'invitation existe et que c'est bien l'inviter
      const inviteResult = await pool.query(
        `SELECT inviter_id, status FROM session_invites WHERE id = $1`,
        [id],
      );

      if (inviteResult.rows.length === 0) {
        res.status(404).json({ error: "Invitation non trouvée" });
        return;
      }

      // Seul l'inviter ou un admin peut supprimer
      if (
        inviteResult.rows[0].inviter_id !== userId &&
        req.user!.role !== "admin"
      ) {
        res.status(403).json({ error: "Non autorisé à supprimer cette invitation" });
        return;
      }

      // Supprimer l'invitation
      await pool.query(`DELETE FROM session_invites WHERE id = $1`, [id]);

      res.json({ message: "Invitation supprimée" });
    } catch (error) {
      console.error("Error deleting invite:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de l'invitation" });
    }
  },
);

export default router;

    try {
      const { sessionId } = req.params;
      const inviterId = req.user!.id;
      const { invitee_email, invitee_username, invitee_id } = req.body;

      // Au moins un identifiant requis
      if (!invitee_email && !invitee_username && !invitee_id) {
        res.status(400).json({
          error: "Email, nom d'utilisateur ou ID de l'invité requis",
        });
        return;
      }

      await client.query("BEGIN");

      // Vérifier que la session existe et récupérer ses infos
      const sessionResult = await client.query(
        `SELECT id, creator_id, visibility, status, max_participants
         FROM sessions 
         WHERE id = $1`,
        [sessionId],
      );

      if (sessionResult.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Session non trouvée" });
        return;
      }

      const session = sessionResult.rows[0];

      // Seul le créateur ou un admin peut inviter
      if (
        session.creator_id !== inviterId &&
        req.user!.role !== "admin"
      ) {
        await client.query("ROLLBACK");
        res
          .status(403)
          .json({ error: "Seul le créateur peut inviter des utilisateurs" });
        return;
      }

      // Vérifier que la session n'est pas terminée
      if (session.status === "completed") {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Cette session est déjà terminée" });
        return;
      }

      // Trouver l'utilisateur à inviter
      let inviteeQuery = "SELECT id, username, email FROM users WHERE ";
      const params: any[] = [];

      if (invitee_id) {
        inviteeQuery += "id = $1";
        params.push(invitee_id);
      } else if (invitee_email) {
        inviteeQuery += "email = $1";
        params.push(invitee_email);
      } else {
        inviteeQuery += "username = $1";
        params.push(invitee_username);
      }

      const inviteeResult = await client.query(inviteeQuery, params);

      if (inviteeResult.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
      }

      const inviteeId = inviteeResult.rows[0].id;

      // Impossible de s'inviter soi-même
      if (inviteeId === inviterId) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Vous ne pouvez pas vous inviter vous-même" });
        return;
      }

      // Vérifier que l'utilisateur n'est pas déjà participant
      const participantCheck = await client.query(
        `SELECT id FROM participants 
         WHERE session_id = $1 AND user_id = $2`,
        [sessionId, inviteeId],
      );

      if (participantCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Cet utilisateur participe déjà à la session" });
        return;
      }

      // Vérifier le nombre de participants vs max_participants
      const participantCount = await client.query(
        `SELECT COUNT(*) as count FROM participants WHERE session_id = $1`,
        [sessionId],
      );

      if (
        session.max_participants &&
        parseInt(participantCount.rows[0].count) >= session.max_participants
      ) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "La session a atteint le nombre maximum de participants" });
        return;
      }

      // Vérifier si une invitation existe déjà
      const existingInvite = await client.query(
        `SELECT id, status FROM session_invites 
         WHERE session_id = $1 AND invitee_id = $2`,
        [sessionId, inviteeId],
      );

      if (existingInvite.rows.length > 0) {
        const invite = existingInvite.rows[0];

        if (invite.status === "pending") {
          await client.query("ROLLBACK");
          res.status(400).json({ error: "Une invitation est déjà en attente pour cet utilisateur" });
          return;
        } else if (invite.status === "rejected") {
          // Renvoyer l'invitation si elle a été rejetée
          await client.query(
            `UPDATE session_invites 
             SET status = 'pending', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [invite.id],
          );

          await client.query("COMMIT");

          res.json({
            message: "Invitation renvoyée",
            invite_id: invite.id,
          });
          return;
        } else if (invite.status === "accepted") {
          await client.query("ROLLBACK");
          res.status(400).json({ error: "Cet utilisateur a déjà accepté une invitation" });
          return;
        }
      }

      // Créer la nouvelle invitation
      const inviteResult = await client.query(
        `INSERT INTO session_invites (session_id, inviter_id, invitee_id, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING id, session_id, inviter_id, invitee_id, status, created_at`,
        [sessionId, inviterId, inviteeId],
      );

      await client.query("COMMIT");

      res.status(201).json({
        message: "Invitation envoyée",
        invite: inviteResult.rows[0],
        invitee: inviteeResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error sending invite:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi de l'invitation" });
    } finally {
      client.release();
    }
  },
);

/**
 * GET /api/invites
 * Liste des invitations reçues par l'utilisateur connecté
 * Query params: ?status=pending|accepted|rejected (optionnel)
 */
router.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { status } = req.query;

      let query = `
        SELECT 
          si.id, si.session_id, si.inviter_id, si.invitee_id, si.status, si.created_at, si.updated_at,
          s.name as session_name, s.difficulty, s.visibility, s.status as session_status, s.max_participants,
          u.username as inviter_username, u.email as inviter_email
        FROM session_invites si
        JOIN sessions s ON s.id = si.session_id
        JOIN users u ON u.id = si.inviter_id
        WHERE si.invitee_id = $1
      `;

      const params: any[] = [userId];

      if (status && ["pending", "accepted", "rejected"].includes(status as string)) {
        query += " AND si.status = $2";
        params.push(status);
      }

      query += " ORDER BY si.created_at DESC";

      const result = await pool.query(query, params);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des invitations" });
    }
  },
);

/**
 * GET /api/invites/sent
 * Liste des invitations envoyées par l'utilisateur connecté
 */
router.get(
  "/sent",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const result = await pool.query(
        `SELECT 
          si.id, si.session_id, si.inviter_id, si.invitee_id, si.status, si.created_at, si.updated_at,
          s.name as session_name, s.difficulty, s.visibility,
          u.username as invitee_username, u.email as invitee_email
         FROM session_invites si
         JOIN sessions s ON s.id = si.session_id
         JOIN users u ON u.id = si.invitee_id
         WHERE si.inviter_id = $1
         ORDER BY si.created_at DESC`,
        [userId],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching sent invites:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des invitations envoyées" });
    }
  },
);

/**
 * POST /api/invites/:id/accept
 * Accepter une invitation
 */
router.post(
  "/:id/accept",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await client.query("BEGIN");

      // Vérifier que l'invitation existe et est pour cet utilisateur
      const inviteResult = await client.query(
        `SELECT si.*, s.status as session_status, s.max_participants
         FROM session_invites si
         JOIN sessions s ON s.id = si.session_id
         WHERE si.id = $1 AND si.invitee_id = $2`,
        [id, userId],
      );

      if (inviteResult.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Invitation non trouvée ou non autorisée" });
        return;
      }

      const invite = inviteResult.rows[0];

      if (invite.status !== "pending") {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Cette invitation a déjà été traitée" });
        return;
      }

      // Vérifier que la session n'est pas terminée
      if (invite.session_status === "completed") {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Cette session est déjà terminée" });
        return;
      }

      // Vérifier que l'utilisateur ne participe pas déjà
      const participantCheck = await client.query(
        `SELECT id FROM participants 
         WHERE session_id = $1 AND user_id = $2`,
        [invite.session_id, userId],
      );

      if (participantCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Vous participez déjà à cette session" });
        return;
      }

      // Vérifier le nombre de participants
      const participantCount = await client.query(
        `SELECT COUNT(*) as count FROM participants WHERE session_id = $1`,
        [invite.session_id],
      );

      if (
        invite.max_participants &&
        parseInt(participantCount.rows[0].count) >= invite.max_participants
      ) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "La session a atteint le nombre maximum de participants" });
        return;
      }

      // Mettre à jour le statut de l'invitation
      await client.query(
        `UPDATE session_invites 
         SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id],
      );

      // Ajouter l'utilisateur aux participants
      const participantResult = await client.query(
        `INSERT INTO participants (session_id, user_id, session_score, completed)
         VALUES ($1, $2, 0, false)
         RETURNING id, session_id, user_id, session_score, completed, created_at`,
        [invite.session_id, userId],
      );

      await client.query("COMMIT");

      res.json({
        message: "Invitation acceptée, vous avez rejoint la session",
        participant: participantResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error accepting invite:", error);
      res.status(500).json({ error: "Erreur lors de l'acceptation de l'invitation" });
    } finally {
      client.release();
    }
  },
);

/**
 * POST /api/invites/:id/reject
 * Rejeter une invitation
 */
router.post(
  "/:id/reject",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Vérifier que l'invitation existe et est pour cet utilisateur
      const inviteResult = await pool.query(
        `SELECT status FROM session_invites 
         WHERE id = $1 AND invitee_id = $2`,
        [id, userId],
      );

      if (inviteResult.rows.length === 0) {
        res.status(404).json({ error: "Invitation non trouvée ou non autorisée" });
        return;
      }

      if (inviteResult.rows[0].status !== "pending") {
        res.status(400).json({ error: "Cette invitation a déjà été traitée" });
        return;
      }

      // Mettre à jour le statut
      await pool.query(
        `UPDATE session_invites 
         SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id],
      );

      res.json({ message: "Invitation rejetée" });
    } catch (error) {
      console.error("Error rejecting invite:", error);
      res.status(500).json({ error: "Erreur lors du rejet de l'invitation" });
    }
  },
);

/**
 * GET /api/sessions/:sessionId/invites
 * Liste des invitations pour une session
 * Accessible au créateur de la session ou aux admins
 */
router.get(
  "/:sessionId/invites",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      // Vérifier que la session existe
      const sessionResult = await pool.query(
        `SELECT creator_id FROM sessions WHERE id = $1`,
        [sessionId],
      );

      if (sessionResult.rows.length === 0) {
        res.status(404).json({ error: "Session non trouvée" });
        return;
      }

      // Seul le créateur ou un admin peut voir les invitations
      if (
        sessionResult.rows[0].creator_id !== userId &&
        req.user!.role !== "admin"
      ) {
        res
          .status(403)
          .json({ error: "Seul le créateur peut voir les invitations" });
        return;
      }

      const result = await pool.query(
        `SELECT 
          si.id, si.session_id, si.inviter_id, si.invitee_id, si.status, si.created_at, si.updated_at,
          u.username as invitee_username, u.email as invitee_email
         FROM session_invites si
         JOIN users u ON u.id = si.invitee_id
         WHERE si.session_id = $1
         ORDER BY si.created_at DESC`,
        [sessionId],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching session invites:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des invitations" });
    }
  },
);

/**
 * DELETE /api/invites/:id
 * Annuler/supprimer une invitation
 * Accessible à l'inviter ou aux admins
 */
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Vérifier que l'invitation existe et que c'est bien l'inviter
      const inviteResult = await pool.query(
        `SELECT inviter_id, status FROM session_invites WHERE id = $1`,
        [id],
      );

      if (inviteResult.rows.length === 0) {
        res.status(404).json({ error: "Invitation non trouvée" });
        return;
      }

      // Seul l'inviter ou un admin peut supprimer
      if (
        inviteResult.rows[0].inviter_id !== userId &&
        req.user!.role !== "admin"
      ) {
        res.status(403).json({ error: "Non autorisé à supprimer cette invitation" });
        return;
      }

      // Supprimer l'invitation
      await pool.query(`DELETE FROM session_invites WHERE id = $1`, [id]);

      res.json({ message: "Invitation supprimée" });
    } catch (error) {
      console.error("Error deleting invite:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de l'invitation" });
    }
  },
);

export default router;
