import { Router, Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../types/auth.types";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/leaderboard/global
 * Classement global des joueurs
 * Query params: ?limit=10 (par défaut 50, max 100)
 */
router.get(
  "/global",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const limit = Math.min(
        Number.parseInt(req.query.limit as string) || 50,
        100,
      );

      const result = await pool.query(
        `SELECT 
          id as user_id,
          username,
          email,
          total_score,
          games_played,
          best_session_score,
          average_score
         FROM users
         WHERE games_played > 0
         ORDER BY total_score DESC, best_session_score DESC
         LIMIT $1`,
        [limit],
      );

      // Ajouter le rang
      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        ...row,
        total_score: Number.parseInt(row.total_score),
        games_played: Number.parseInt(row.games_played),
        best_session_score: Number.parseInt(row.best_session_score),
        average_score: Number.parseFloat(row.average_score),
      }));

      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching global leaderboard:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération du classement global" });
    }
  },
);

/**
 * GET /api/leaderboard/friends
 * Classement filtré aux amis de l'utilisateur connecté
 * Inclut l'utilisateur connecté dans les résultats
 */
router.get(
  "/friends",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const result = await pool.query(
        `SELECT 
          u.id as user_id,
          u.username,
          u.email,
          u.total_score,
          u.games_played,
          u.best_session_score,
          u.average_score
         FROM users u
         WHERE u.games_played > 0
           AND (
             u.id IN (
               SELECT user_id_2 FROM friendships WHERE user_id_1 = $1
               UNION
               SELECT user_id_1 FROM friendships WHERE user_id_2 = $1
             )
             OR u.id = $1
           )
         ORDER BY u.total_score DESC, u.best_session_score DESC`,
        [userId],
      );

      // Ajouter le rang et marquer l'utilisateur connecté
      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        ...row,
        total_score: Number.parseInt(row.total_score),
        games_played: Number.parseInt(row.games_played),
        best_session_score: Number.parseInt(row.best_session_score),
        average_score: Number.parseFloat(row.average_score),
        is_me: row.user_id === userId,
      }));

      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching friends leaderboard:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération du classement entre amis",
      });
    }
  },
);

/**
 * GET /api/leaderboard/session/:id
 * Classement d'une session spécifique
 * Liste tous les participants avec leurs scores
 */
router.get(
  "/session/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: sessionId } = req.params;
      const userId = req.user!.id;

      // Vérifier que la session existe
      const sessionCheck = await pool.query(
        "SELECT id, status, visibility, creator_id FROM sessions WHERE id = $1",
        [sessionId]
      );

      if (sessionCheck.rows.length === 0) {
        res.status(404).json({ error: "Session non trouvée" });
        return;
      }

      const session = sessionCheck.rows[0];

      // Vérifier les permissions (session publique, créateur, ou participant)
      const isCreator = session.creator_id === userId;
      const isPublic = session.visibility === 'public';
      
      const participantCheck = await pool.query(
        "SELECT id FROM participants WHERE session_id = $1 AND user_id = $2",
        [sessionId, userId]
      );
      const isParticipant = participantCheck.rows.length > 0;

      if (!isPublic && !isCreator && !isParticipant) {
        res.status(403).json({ error: "Vous n'avez pas accès à ce classement" });
        return;
      }

      // Récupérer le classement
      const result = await pool.query(
        `SELECT 
          p.id as participant_id,
          p.user_id,
          p.session_score,
          p.completed,
          u.username,
          u.email,
          (SELECT COUNT(*) FROM answers WHERE participant_id = p.id) as answers_count
         FROM participants p
         JOIN users u ON u.id = p.user_id
         WHERE p.session_id = $1
         ORDER BY p.session_score DESC, p.created_at ASC`,
        [sessionId]
      );

      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        participant_id: row.participant_id,
        user_id: row.user_id,
        username: row.username,
        email: row.email,
        session_score: Number.parseInt(row.session_score),
        answers_count: Number.parseInt(row.answers_count),
        completed: row.completed,
        is_me: row.user_id === userId
      }));

      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching session leaderboard:", error);
      res.status(500).json({ 
        error: "Erreur lors de la récupération du classement de la session" 
      });
    }
  },
);

export default router;
