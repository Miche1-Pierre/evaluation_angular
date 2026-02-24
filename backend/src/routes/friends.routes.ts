import { Router, Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../types/auth.types";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * Helper function to find receiver by email, username, or id
 */
async function findReceiver(
  receiver_email?: string,
  receiver_username?: string,
  receiver_id?: number,
) {
  let receiverQuery = "SELECT id, username, email FROM users WHERE ";
  const params: any[] = [];

  if (receiver_id) {
    receiverQuery += "id = $1";
    params.push(receiver_id);
  } else if (receiver_email) {
    receiverQuery += "email = $1";
    params.push(receiver_email);
  } else {
    receiverQuery += "username = $1";
    params.push(receiver_username);
  }

  const receiverResult = await pool.query(receiverQuery, params);
  return receiverResult.rows.length > 0 ? receiverResult.rows[0] : null;
}

/**
 * Helper function to check if users are already friends
 */
async function areAlreadyFriends(user1: number, user2: number) {
  const friendshipCheck = await pool.query(
    `SELECT id FROM friendships 
     WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)`,
    [Math.min(user1, user2), Math.max(user1, user2)],
  );
  return friendshipCheck.rows.length > 0;
}

/**
 * Helper function to check existing friend request
 */
async function getExistingRequest(senderId: number, receiverId: number) {
  const existingRequest = await pool.query(
    `SELECT id, status, sender_id FROM friend_requests 
     WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
    [senderId, receiverId],
  );
  return existingRequest.rows.length > 0 ? existingRequest.rows[0] : null;
}

/**
 * GET /api/friends
 * Liste des amis de l'utilisateur connecté
 */
router.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      // Utiliser la vue user_friends pour récupérer les amis de manière bidirectionnelle
      const result = await pool.query(
        `SELECT 
          friend_id as id,
          friend_username as username,
          friend_email as email,
          created_at as friends_since
         FROM user_friends
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des amis" });
    }
  },
);

/**
 * POST /api/friends/request
 * Envoyer une demande d'amitié
 * Body: { receiver_email } ou { receiver_username } ou { receiver_id }
 */

/**
 * GET /api/friends/requests
 * Liste des demandes d'amitié reçues (en attente)
 */
router.get(
  "/requests",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const result = await pool.query(
        `SELECT 
          fr.id, fr.sender_id, fr.receiver_id, fr.status, fr.created_at,
          u.username as sender_username,
          u.email as sender_email
         FROM friend_requests fr
         JOIN users u ON u.id = fr.sender_id
         WHERE fr.receiver_id = $1 AND fr.status = 'pending'
         ORDER BY fr.created_at DESC`,
        [userId],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des demandes" });
    }
  },
);

/**
 * GET /api/friends/requests/sent
 * Liste des demandes d'amitié envoyées
 */
router.get(
  "/requests/sent",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const result = await pool.query(
        `SELECT 
          fr.id, fr.sender_id, fr.receiver_id, fr.status, fr.created_at, fr.updated_at,
          u.username as receiver_username,
          u.email as receiver_email
         FROM friend_requests fr
         JOIN users u ON u.id = fr.receiver_id
         WHERE fr.sender_id = $1
         ORDER BY fr.created_at DESC`,
        [userId],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching sent requests:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération des demandes envoyées",
      });
    }
  },
);

/**
 * POST /api/friends/requests/:id/accept
 * Accepter une demande d'amitié
 */
router.post(
  "/requests/:id/accept",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await client.query("BEGIN");

      // Vérifier que la demande existe et est pour cet utilisateur
      const requestResult = await client.query(
        `SELECT sender_id, receiver_id, status 
         FROM friend_requests 
         WHERE id = $1 AND receiver_id = $2`,
        [id, userId],
      );

      if (requestResult.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Demande non trouvée ou non autorisée" });
        return;
      }

      const request = requestResult.rows[0];

      if (request.status !== "pending") {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Cette demande a déjà été traitée" });
        return;
      }

      // Mettre à jour le statut de la demande
      await client.query(
        `UPDATE friend_requests 
         SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id],
      );

      // Créer l'amitié (bidirectionnelle via la structure de la table)
      const user1 = Math.min(request.sender_id, request.receiver_id);
      const user2 = Math.max(request.sender_id, request.receiver_id);

      await client.query(
        `INSERT INTO friendships (user_id_1, user_id_2)
         VALUES ($1, $2)
         ON CONFLICT (user_id_1, user_id_2) DO NOTHING`,
        [user1, user2],
      );

      await client.query("COMMIT");

      // Récupérer les infos du nouvel ami
      const friendResult = await pool.query(
        `SELECT id, username, email FROM users WHERE id = $1`,
        [request.sender_id],
      );

      res.json({
        message: "Demande d'amitié acceptée",
        friend: friendResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error accepting friend request:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de l'acceptation de la demande" });
    } finally {
      client.release();
    }
  },
);

/**
 * POST /api/friends/requests/:id/reject
 * Rejeter une demande d'amitié
 */
router.post(
  "/requests/:id/reject",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Vérifier que la demande existe et est pour cet utilisateur
      const requestResult = await pool.query(
        `SELECT status FROM friend_requests 
         WHERE id = $1 AND receiver_id = $2`,
        [id, userId],
      );

      if (requestResult.rows.length === 0) {
        res.status(404).json({ error: "Demande non trouvée ou non autorisée" });
        return;
      }

      if (requestResult.rows[0].status !== "pending") {
        res.status(400).json({ error: "Cette demande a déjà été traitée" });
        return;
      }

      // Mettre à jour le statut
      await pool.query(
        `UPDATE friend_requests 
         SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id],
      );

      res.json({ message: "Demande d'amitié rejetée" });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({ error: "Erreur lors du rejet de la demande" });
    }
  },
);

/**
 * DELETE /api/friends/:id
 * Supprimer un ami
 */
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const friendId = Number.parseInt(id);

      if (Number.isNaN(friendId)) {
        res.status(400).json({ error: "ID invalide" });
        return;
      }

      await client.query("BEGIN");

      // Supprimer l'amitié
      const user1 = Math.min(userId, friendId);
      const user2 = Math.max(userId, friendId);

      const deleteResult = await client.query(
        `DELETE FROM friendships 
         WHERE user_id_1 = $1 AND user_id_2 = $2
         RETURNING id`,
        [user1, user2],
      );

      if (deleteResult.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Amitié non trouvée" });
        return;
      }

      // Optionnel : Supprimer aussi les demandes d'amitié associées
      await client.query(
        `DELETE FROM friend_requests 
         WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
        [userId, friendId],
      );

      await client.query("COMMIT");

      res.json({ message: "Ami supprimé avec succès" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting friend:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de l'ami" });
    } finally {
      client.release();
    }
  },
);

/**
 * GET /api/friends/search
 * Rechercher des utilisateurs pour les ajouter en ami
 * Query: ?q=username ou email
 */
router.get(
  "/search",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { q } = req.query;

      if (!q || typeof q !== "string" || q.trim().length < 2) {
        res
          .status(400)
          .json({ error: "Recherche trop courte (minimum 2 caractères)" });
        return;
      }

      const searchTerm = `%${q.trim()}%`;

      // Rechercher des utilisateurs (sauf soi-même et ses amis actuels)
      const result = await pool.query(
        `SELECT DISTINCT
          u.id, u.username, u.email, u.total_score, u.games_played,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM friendships f 
              WHERE (f.user_id_1 = $1 AND f.user_id_2 = u.id) 
                 OR (f.user_id_2 = $1 AND f.user_id_1 = u.id)
            ) THEN true
            ELSE false
          END as is_friend,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM friend_requests fr 
              WHERE fr.sender_id = $1 AND fr.receiver_id = u.id AND fr.status = 'pending'
            ) THEN 'sent'
            WHEN EXISTS (
              SELECT 1 FROM friend_requests fr 
              WHERE fr.sender_id = u.id AND fr.receiver_id = $1 AND fr.status = 'pending'
            ) THEN 'received'
            ELSE null
          END as request_status
         FROM users u
         WHERE u.id != $1 
           AND (u.username ILIKE $2 OR u.email ILIKE $2)
         ORDER BY u.username ASC
         LIMIT 20`,
        [userId, searchTerm],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Erreur lors de la recherche" });
    }
  },
);

export default router;
