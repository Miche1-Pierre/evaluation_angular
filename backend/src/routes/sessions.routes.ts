import { Router, Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../types/auth.types";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/sessions
 * Créer une nouvelle session de jeu
 * Sélectionne automatiquement 4 produits aléatoires
 */
router.post(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const client = await pool.connect();
    
    try {
      const { name, difficulty, visibility, max_participants } = req.body;
      const userId = req.user!.id;

      // Validation
      if (!name) {
        res.status(400).json({ error: "Le nom de la session est requis" });
        return;
      }

      const validDifficulties = ['easy', 'medium', 'hard'];
      const validVisibilities = ['public', 'private', 'friends_only'];
      
      const sessionDifficulty = difficulty && validDifficulties.includes(difficulty) ? difficulty : 'medium';
      const sessionVisibility = visibility && validVisibilities.includes(visibility) ? visibility : 'public';
      const maxPart = max_participants && max_participants > 0 ? max_participants : 10;

      await client.query('BEGIN');

      // Créer la session
      const sessionResult = await client.query(
        `INSERT INTO sessions (name, creator_id, difficulty, visibility, max_participants)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, creator_id, status, difficulty, visibility, max_participants, created_at`,
        [name, userId, sessionDifficulty, sessionVisibility, maxPart]
      );

      const session = sessionResult.rows[0];

      // Sélectionner 4 produits aléatoires
      const productsResult = await client.query(
        `SELECT id FROM products ORDER BY RANDOM() LIMIT 4`
      );

      if (productsResult.rows.length < 4) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: "Pas assez de produits dans la base (minimum 4 requis)" });
        return;
      }

      // Insérer les produits de la session
      for (let i = 0; i < 4; i++) {
        await client.query(
          `INSERT INTO session_products (session_id, product_id, position)
           VALUES ($1, $2, $3)`,
          [session.id, productsResult.rows[i].id, i + 1]
        );
      }

      await client.query('COMMIT');

      // Récupérer les détails complets de la session créée
      const fullSessionResult = await pool.query(
        `SELECT 
          s.id, s.name, s.creator_id, s.status, s.difficulty, s.visibility, s.max_participants, s.created_at,
          u.username as creator_username,
          (SELECT COUNT(*) FROM participants WHERE session_id = s.id) as participant_count
         FROM sessions s
         JOIN users u ON u.id = s.creator_id
         WHERE s.id = $1`,
        [session.id]
      );

      res.status(201).json(fullSessionResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Erreur lors de la création de la session" });
    } finally {
      client.release();
    }
  }
);

/**
 * GET /api/sessions
 * Liste les sessions disponibles
 * Filtre selon la visibilité et les relations d'amitié
 */
router.get(
  "/",
  optionalAuthMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { status, visibility, creator_id } = req.query;

      let query = `
        SELECT 
          s.id, s.name, s.creator_id, s.status, s.difficulty, s.visibility, s.max_participants, s.created_at,
          u.username as creator_username,
          (SELECT COUNT(*) FROM participants WHERE session_id = s.id) as participant_count,
          ${userId ? `(SELECT COUNT(*) > 0 FROM participants WHERE session_id = s.id AND user_id = ${userId}) as is_participant` : 'false as is_participant'}
        FROM sessions s
        JOIN users u ON u.id = s.creator_id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 1;

      // Filtre par statut
      if (status) {
        query += ` AND s.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      // Filtre par créateur
      if (creator_id) {
        query += ` AND s.creator_id = $${paramCount}`;
        params.push(creator_id);
        paramCount++;
      }

      // Filtre par visibilité si spécifié
      if (visibility) {
        query += ` AND s.visibility = $${paramCount}`;
        params.push(visibility);
        paramCount++;
      }

      // Si utilisateur connecté, inclure :
      // - Sessions publiques
      // - Ses propres sessions (créateur)
      // - Sessions friends_only si ami du créateur
      // - Sessions privées si invité et accepté
      if (userId) {
        if (!visibility) {
          query += ` AND (
            s.visibility = 'public'
            OR s.creator_id = $${paramCount}
            OR (
              s.visibility = 'friends_only' 
              AND EXISTS (
                SELECT 1 FROM friendships f
                WHERE (f.user_id_1 = $${paramCount} AND f.user_id_2 = s.creator_id)
                   OR (f.user_id_2 = $${paramCount} AND f.user_id_1 = s.creator_id)
              )
            )
            OR (
              s.visibility = 'private'
              AND EXISTS (
                SELECT 1 FROM session_invites si
                WHERE si.session_id = s.id 
                  AND si.invitee_id = $${paramCount}
                  AND si.status = 'accepted'
              )
            )
          )`;
          params.push(userId);
        }
      } else if (!visibility) {
        // Non connecté : seulement les sessions publiques
        query += ` AND s.visibility = 'public'`;
      }

      query += ` ORDER BY s.created_at DESC`;

      const result = await pool.query(query, params);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des sessions" });
    }
  }
);

/**
 * GET /api/sessions/:id
 * Détails d'une session spécifique
 */
router.get(
  "/:id",
  optionalAuthMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Récupérer les infos de la session
      const sessionResult = await pool.query(
        `SELECT 
          s.id, s.name, s.creator_id, s.status, s.difficulty, s.visibility, s.max_participants, s.created_at, s.updated_at,
          u.username as creator_username, u.email as creator_email,
          (SELECT COUNT(*) FROM participants WHERE session_id = s.id) as participant_count,
          ${userId ? `(SELECT COUNT(*) > 0 FROM participants WHERE session_id = s.id AND user_id = ${userId}) as is_participant` : 'false as is_participant'},
          ${userId ? `(SELECT COUNT(*) > 0 FROM participants p WHERE p.session_id = s.id AND p.user_id = ${userId} AND p.completed = true) as has_completed` : 'false as has_completed'}
        FROM sessions s
        JOIN users u ON u.id = s.creator_id
        WHERE s.id = $1`,
        [id]
      );

      if (sessionResult.rows.length === 0) {
        res.status(404).json({ error: "Session non trouvée" });
        return;
      }

      const session = sessionResult.rows[0];

      // Vérifier les permissions d'accès
      if (session.visibility === 'private' && userId !== session.creator_id) {
        // Vérifier si l'utilisateur a une invitation acceptée
        const inviteResult = await pool.query(
          `SELECT id FROM session_invites 
           WHERE session_id = $1 AND invitee_id = $2 AND status = 'accepted'`,
          [id, userId]
        );

        if (inviteResult.rows.length === 0) {
          res.status(403).json({ error: "Accès refusé : session privée" });
          return;
        }
      }

      if (session.visibility === 'friends_only' && userId !== session.creator_id) {
        // Vérifier l'amitié
        const friendshipResult = await pool.query(
          `SELECT id FROM friendships 
           WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)`,
          [userId, session.creator_id]
        );

        if (friendshipResult.rows.length === 0 && !userId) {
          res.status(403).json({ error: "Accès refusé : session réservée aux amis" });
          return;
        }
      }

      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de la session" });
    }
  }
);

/**
 * DELETE /api/sessions/:id
 * Supprimer une session (créateur ou admin uniquement)
 */
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Vérifier que la session existe et que l'utilisateur est le créateur ou admin
      const sessionResult = await pool.query(
        `SELECT creator_id FROM sessions WHERE id = $1`,
        [id]
      );

      if (sessionResult.rows.length === 0) {
        res.status(404).json({ error: "Session non trouvée" });
        return;
      }

      const session = sessionResult.rows[0];

      if (session.creator_id !== userId && userRole !== 'admin') {
        res.status(403).json({ error: "Vous n'avez pas la permission de supprimer cette session" });
        return;
      }

      // Supprimer la session (CASCADE supprime automatiquement les relations)
      await pool.query(`DELETE FROM sessions WHERE id = $1`, [id]);

      res.json({ message: "Session supprimée avec succès", id });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de la session" });
    }
  }
);

/**
 * POST /api/sessions/:id/join
 * Rejoindre une session (créer un participant)
 */
router.post(
  "/:id/join",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Vérifier que la session existe
      const sessionResult = await pool.query(
        `SELECT s.*, 
          (SELECT COUNT(*) FROM participants WHERE session_id = s.id) as participant_count
         FROM sessions s
         WHERE s.id = $1`,
        [id]
      );

      if (sessionResult.rows.length === 0) {
        res.status(404).json({ error: "Session non trouvée" });
        return;
      }

      const session = sessionResult.rows[0];

      // Vérifier si la session est complète
      if (session.participant_count >= session.max_participants) {
        res.status(400).json({ error: "La session est complète" });
        return;
      }

      // Vérifier si l'utilisateur est déjà participant
      const existingParticipant = await pool.query(
        `SELECT id FROM participants WHERE session_id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (existingParticipant.rows.length > 0) {
        res.status(400).json({ error: "Vous participez déjà à cette session" });
        return;
      }

      // Vérifier les permissions selon la visibilité
      if (session.visibility === 'private') {
        // Vérifier l'invitation
        const inviteResult = await pool.query(
          `SELECT id FROM session_invites 
           WHERE session_id = $1 AND invitee_id = $2 AND status = 'accepted'`,
          [id, userId]
        );

        if (inviteResult.rows.length === 0) {
          res.status(403).json({ error: "Invitation requise pour cette session privée" });
          return;
        }
      }

      if (session.visibility === 'friends_only' && session.creator_id !== userId) {
        // Vérifier l'amitié
        const friendshipResult = await pool.query(
          `SELECT id FROM friendships 
           WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)`,
          [userId, session.creator_id]
        );

        if (friendshipResult.rows.length === 0) {
          res.status(403).json({ error: "Session réservée aux amis du créateur" });
          return;
        }
      }

      // Créer le participant
      const participantResult = await pool.query(
        `INSERT INTO participants (session_id, user_id, session_score, completed)
         VALUES ($1, $2, 0, false)
         RETURNING id, session_id, user_id, session_score, completed, created_at`,
        [id, userId]
      );

      res.status(201).json({
        message: "Vous avez rejoint la session avec succès",
        participant: participantResult.rows[0]
      });
    } catch (error) {
      console.error("Error joining session:", error);
      res.status(500).json({ error: "Erreur lors de la tentative de rejoindre la session" });
    }
  }
);

/**
 * GET /api/sessions/:id/participants
 * Liste des participants d'une session
 */
router.get(
  "/:id/participants",
  optionalAuthMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT 
          p.id, p.session_id, p.user_id, p.session_score, p.completed, p.created_at,
          u.username, u.email,
          (SELECT COUNT(*) FROM answers a WHERE a.participant_id = p.id) as answers_count
         FROM participants p
         JOIN users u ON u.id = p.user_id
         WHERE p.session_id = $1
         ORDER BY p.session_score DESC, p.created_at ASC`,
        [id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des participants" });
    }
  }
);

/**
 * POST /api/sessions/:id/invite
 * Inviter un utilisateur à une session
 * Accessible au créateur de la session ou aux admins
 */
router.post(
  "/:id/invite",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
      const { id: sessionId } = req.params;
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
 * GET /api/sessions/:id/invites
 * Liste des invitations pour une session
 * Accessible au créateur de la session ou aux admins
 */
router.get(
  "/:id/invites",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: sessionId } = req.params;
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
 * GET /api/sessions/:id/products
 * Récupère les 4 produits de la session SANS les prix
 * Accessible aux participants de la session
 */
router.get(
  "/:id/products",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: sessionId } = req.params;
      const userId = req.user!.id;

      // Vérifier que l'utilisateur est participant
      const participantCheck = await pool.query(
        `SELECT id FROM participants WHERE session_id = $1 AND user_id = $2`,
        [sessionId, userId],
      );

      if (participantCheck.rows.length === 0) {
        res.status(403).json({ error: "Vous devez participer à cette session" });
        return;
      }

      // Récupérer les produits sans les prix
      const result = await pool.query(
        `SELECT 
          p.id, p.name, p.image_url, sp.position
         FROM session_products sp
         JOIN products p ON p.id = sp.product_id
         WHERE sp.session_id = $1
         ORDER BY sp.position ASC`,
        [sessionId],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching session products:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des produits" });
    }
  },
);

/**
 * POST /api/sessions/:id/answer
 * Soumet une réponse pour un produit
 * Body: { product_id: number, guessed_price: number }
 * Calcule le score: 100 - |prix_estimé - prix_réel|
 */
router.post(
  "/:id/answer",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
      const { id: sessionId } = req.params;
      const userId = req.user!.id;
      const { product_id, guessed_price } = req.body;

      // Validation
      if (!product_id || guessed_price === undefined || guessed_price < 0) {
        res.status(400).json({ 
          error: "product_id et guessed_price (>= 0) requis" 
        });
        return;
      }

      await client.query("BEGIN");

      // Vérifier que l'utilisateur est participant
      const participantResult = await client.query(
        `SELECT id, session_score, completed FROM participants 
         WHERE session_id = $1 AND user_id = $2`,
        [sessionId, userId],
      );

      if (participantResult.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(403).json({ error: "Vous devez participer à cette session" });
        return;
      }

      const participant = participantResult.rows[0];

      // Vérifier que la session n'est pas terminée
      const sessionResult = await client.query(
        `SELECT status FROM sessions WHERE id = $1`,
        [sessionId],
      );

      if (sessionResult.rows[0].status === "completed") {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Cette session est déjà terminée" });
        return;
      }

      // Vérifier que le produit fait partie de la session
      const productInSession = await client.query(
        `SELECT sp.product_id, p.price 
         FROM session_products sp
         JOIN products p ON p.id = sp.product_id
         WHERE sp.session_id = $1 AND sp.product_id = $2`,
        [sessionId, product_id],
      );

      if (productInSession.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Ce produit ne fait pas partie de cette session" });
        return;
      }

      const actualPrice = parseFloat(productInSession.rows[0].price);

      // Vérifier que l'utilisateur n'a pas déjà répondu à ce produit
      const existingAnswer = await client.query(
        `SELECT id FROM answers 
         WHERE participant_id = $1 AND product_id = $2`,
        [participant.id, product_id],
      );

      if (existingAnswer.rows.length > 0) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Vous avez déjà répondu à ce produit" });
        return;
      }

      // Calculer le score: 100 - |différence|, minimum 0
      const difference = Math.abs(parseFloat(guessed_price) - actualPrice);
      const score = Math.max(0, Math.round(100 - difference));

      // Enregistrer la réponse
      const answerResult = await client.query(
        `INSERT INTO answers (participant_id, product_id, guessed_price, score)
         VALUES ($1, $2, $3, $4)
         RETURNING id, participant_id, product_id, guessed_price, score, created_at`,
        [participant.id, product_id, guessed_price, score],
      );

      // Mettre à jour le score total du participant
      const newSessionScore = participant.session_score + score;

      // Vérifier si le participant a répondu à tous les produits (4)
      const answerCount = await client.query(
        `SELECT COUNT(*) as count FROM answers WHERE participant_id = $1`,
        [participant.id],
      );

      const totalAnswered = parseInt(answerCount.rows[0].count);
      const isCompleted = totalAnswered >= 4;

      // Mettre à jour le participant
      await client.query(
        `UPDATE participants 
         SET session_score = $1, completed = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [newSessionScore, isCompleted, participant.id],
      );

      // Si le participant a terminé, mettre à jour ses stats globales
      if (isCompleted) {
        await client.query(
          `UPDATE users 
           SET 
             total_score = total_score + $1,
             games_played = games_played + 1,
             best_session_score = GREATEST(best_session_score, $1),
             average_score = (total_score + $1)::decimal / (games_played + 1),
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [newSessionScore, userId],
        );
      }

      await client.query("COMMIT");

      res.json({
        message: isCompleted 
          ? "Réponse enregistrée ! Vous avez terminé la session"
          : "Réponse enregistrée",
        answer: answerResult.rows[0],
        score,
        actual_price: actualPrice,
        session_score: newSessionScore,
        completed: isCompleted,
        answers_count: totalAnswered,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error submitting answer:", error);
      res.status(500).json({ error: "Erreur lors de la soumission de la réponse" });
    } finally {
      client.release();
    }
  },
);

/**
 * GET /api/sessions/:id/leaderboard
 * Classement des participants de la session
 */
router.get(
  "/:id/leaderboard",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: sessionId } = req.params;

      // Vérifier que la session existe
      const sessionCheck = await pool.query(
        `SELECT id FROM sessions WHERE id = $1`,
        [sessionId],
      );

      if (sessionCheck.rows.length === 0) {
        res.status(404).json({ error: "Session non trouvée" });
        return;
      }

      // Récupérer le classement
      const result = await pool.query(
        `SELECT 
          p.id as participant_id,
          p.session_score,
          p.completed,
          u.id as user_id,
          u.username,
          u.email,
          COUNT(a.id) as answers_count
         FROM participants p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN answers a ON a.participant_id = p.id
         WHERE p.session_id = $1
         GROUP BY p.id, u.id
         ORDER BY p.session_score DESC, p.created_at ASC`,
        [sessionId],
      );

      // Ajouter le rang
      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        ...row,
        session_score: parseInt(row.session_score),
        answers_count: parseInt(row.answers_count),
      }));

      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching session leaderboard:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du classement" });
    }
  },
);

export default router;
