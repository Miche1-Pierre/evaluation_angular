import { Router, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware';
import { AuthRequest } from '../types/auth.types';

const router = Router();
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'angular',
  password: process.env.DB_PASSWORD || 'postgres',
  port: Number.parseInt(process.env.DB_PORT || '5433', 10),
});

// Middleware pour vérifier le rôle admin
const requireAdmin = (req: AuthRequest, res: Response, next: Function): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Accès refusé. Droits administrateur requis.' });
    return;
  }
  next();
};

/**
 * GET /api/admin/stats
 * Récupère les statistiques générales de la plateforme
 */
router.get('/stats', authMiddleware, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    // Nombre total d'utilisateurs
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = Number.parseInt(usersResult.rows[0].count, 10);

    // Nombre de sessions actives (status = 'active')
    const activeSessionsResult = await pool.query(
      "SELECT COUNT(*) as count FROM sessions WHERE status = 'active'"
    );
    const activeSessions = Number.parseInt(activeSessionsResult.rows[0].count, 10);

    // Nombre total de produits
    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    const totalProducts = Number.parseInt(productsResult.rows[0].count, 10);

    // Nombre de parties terminées
    const completedSessionsResult = await pool.query(
      "SELECT COUNT(*) as count FROM sessions WHERE status = 'completed'"
    );
    const completedSessions = Number.parseInt(completedSessionsResult.rows[0].count, 10);

    // Nombre total de sessions
    const totalSessionsResult = await pool.query('SELECT COUNT(*) as count FROM sessions');
    const totalSessions = Number.parseInt(totalSessionsResult.rows[0].count, 10);

    // Nombre de thèmes
    const themesResult = await pool.query('SELECT COUNT(*) as count FROM themes');
    const totalThemes = Number.parseInt(themesResult.rows[0].count, 10);

    // Nombre d'amitiés
    const friendshipsResult = await pool.query('SELECT COUNT(*) as count FROM friendships');
    const totalFriendships = Number.parseInt(friendshipsResult.rows[0].count, 10);

    res.json({
      users: {
        total: totalUsers,
      },
      sessions: {
        active: activeSessions,
        completed: completedSessions,
        total: totalSessions,
      },
      products: {
        total: totalProducts,
      },
      themes: {
        total: totalThemes,
      },
      friendships: {
        total: totalFriendships,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/sessions/recent
 * Récupère les sessions récentes avec les détails
 */
router.get('/sessions/recent', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Number.parseInt(req.query.limit as string, 10) || 10;

    const result = await pool.query(
      `SELECT 
        s.id,
        s.name,
        s.status,
        s.max_players,
        s.created_at,
        s.updated_at,
        u.username as creator_name,
        t.name as theme_name,
        t.icon as theme_icon,
        COUNT(DISTINCT sp.user_id) as player_count
      FROM sessions s
      LEFT JOIN users u ON s.creator_id = u.id
      LEFT JOIN themes t ON s.theme_id = t.id
      LEFT JOIN session_participants sp ON s.id = sp.session_id
      GROUP BY s.id, u.username, t.name, t.icon
      ORDER BY s.created_at DESC
      LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions récentes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/users/recent
 * Récupère les utilisateurs récemment inscrits
 */
router.get('/users/recent', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Number.parseInt(req.query.limit as string, 10) || 10;

    const result = await pool.query(
      `SELECT 
        id,
        username,
        email,
        role,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs récents:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/activity
 * Récupère l'activité récente sur la plateforme
 */
router.get('/activity', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Number.parseInt(req.query.limit as string, 10) || 20;

    // Récupérer les sessions récentes
    const sessionsResult = await pool.query(
      `SELECT 
        'session_created' as type,
        s.id as entity_id,
        s.name as entity_name,
        u.username,
        s.created_at as timestamp
      FROM sessions s
      LEFT JOIN users u ON s.creator_id = u.id
      ORDER BY s.created_at DESC
      LIMIT $1`,
      [Math.floor(limit / 2)]
    );

    // Récupérer les nouveaux utilisateurs
    const usersResult = await pool.query(
      `SELECT 
        'user_registered' as type,
        id as entity_id,
        username as entity_name,
        username,
        created_at as timestamp
      FROM users
      ORDER BY created_at DESC
      LIMIT $1`,
      [Math.floor(limit / 2)]
    );

    // Combiner et trier par date
    const activities = [...sessionsResult.rows, ...usersResult.rows]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    res.json(activities);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/stats/trends
 * Récupère les tendances (activité des 7 derniers jours)
 */
router.get('/stats/trends', authMiddleware, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    // Sessions créées par jour (7 derniers jours)
    const sessionsResult = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM sessions
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC`
    );

    // Nouveaux utilisateurs par jour (7 derniers jours)
    const usersResult = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC`
    );

    res.json({
      sessions: sessionsResult.rows,
      users: usersResult.rows,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tendances:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
