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
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

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
        total_score: parseInt(row.total_score),
        games_played: parseInt(row.games_played),
        best_session_score: parseInt(row.best_session_score),
        average_score: parseFloat(row.average_score),
      }));

      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching global leaderboard:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du classement global" });
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
        total_score: parseInt(row.total_score),
        games_played: parseInt(row.games_played),
        best_session_score: parseInt(row.best_session_score),
        average_score: parseFloat(row.average_score),
        is_me: row.user_id === userId,
      }));

      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching friends leaderboard:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du classement entre amis" });
    }
  },
);

export default router;
