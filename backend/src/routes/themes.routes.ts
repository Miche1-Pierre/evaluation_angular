import { Router, Request, Response } from "express";
import { pool } from "../config/database";

const router = Router();

/**
 * GET /api/themes
 * Liste tous les thèmes disponibles
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.description, t.icon, 
              COUNT(p.id)::int as product_count,
              t.created_at, t.updated_at
       FROM themes t
       LEFT JOIN products p ON p.theme_id = t.id
       GROUP BY t.id, t.name, t.description, t.icon, t.created_at, t.updated_at
       ORDER BY t.name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching themes:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des thèmes" });
  }
});

/**
 * GET /api/themes/:id
 * Détails d'un thème par ID
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.id, t.name, t.description, t.icon,
              COUNT(p.id)::int as product_count,
              t.created_at, t.updated_at
       FROM themes t
       LEFT JOIN products p ON p.theme_id = t.id
       WHERE t.id = $1
       GROUP BY t.id, t.name, t.description, t.icon, t.created_at, t.updated_at`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Thème non trouvé" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching theme:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du thème" });
  }
});

/**
 * GET /api/themes/:id/products
 * Récupère tous les produits d'un thème
 */
router.get("/:id/products", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Vérifier que le thème existe
    const themeCheck = await pool.query(
      `SELECT id FROM themes WHERE id = $1`,
      [id]
    );

    if (themeCheck.rows.length === 0) {
      res.status(404).json({ error: "Thème non trouvé" });
      return;
    }

    // Récupérer les produits
    const result = await pool.query(
      `SELECT id, theme_id, name, price, image_url, created_at, updated_at
       FROM products
       WHERE theme_id = $1
       ORDER BY name ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching theme products:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des produits du thème" });
  }
});

export default router;
