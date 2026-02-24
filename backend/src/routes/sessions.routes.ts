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

export default router;
