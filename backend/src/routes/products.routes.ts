import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../types/auth.types";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/products
 * Liste tous les produits disponibles
 * Query params:
 *  - theme_id: Filtrer par thème (optionnel)
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { theme_id } = req.query;

    let query = `
      SELECT id, theme_id, name, price, image_url, created_at, updated_at
      FROM products
    `;
    const params: any[] = [];

    if (theme_id) {
      query += ` WHERE theme_id = $1`;
      params.push(theme_id);
    }

    query += ` ORDER BY name ASC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des produits" });
  }
});

/**
 * GET /api/products/:id
 * Détails d'un produit par ID
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, theme_id, name, price, image_url, created_at, updated_at
       FROM products
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Produit non trouvé" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du produit" });
  }
});

/**
 * POST /api/products
 * Créer un nouveau produit (admin only)
 */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, price, image_url } = req.body;

      if (!name || price === undefined || price === null) {
        res.status(400).json({ error: "Nom et prix requis" });
        return;
      }

      if (price < 0) {
        res.status(400).json({ error: "Le prix doit être positif" });
        return;
      }

      const result = await pool.query(
        `INSERT INTO products (name, price, image_url)
         VALUES ($1, $2, $3)
         RETURNING id, name, price, image_url, created_at, updated_at`,
        [name, price, image_url || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Erreur lors de la création du produit" });
    }
  }
);

/**
 * PUT /api/products/:id
 * Mettre à jour un produit (admin only)
 */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, price, image_url } = req.body;

      if (!name || price === undefined || price === null) {
        res.status(400).json({ error: "Nom et prix requis" });
        return;
      }

      if (price < 0) {
        res.status(400).json({ error: "Le prix doit être positif" });
        return;
      }

      const result = await pool.query(
        `UPDATE products
         SET name = $1, price = $2, image_url = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, name, price, image_url, created_at, updated_at`,
        [name, price, image_url || null, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Produit non trouvé" });
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du produit" });
    }
  }
);

/**
 * DELETE /api/products/:id
 * Supprimer un produit (admin only)
 */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `DELETE FROM products WHERE id = $1 RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Produit non trouvé" });
        return;
      }

      res.json({ message: "Produit supprimé avec succès", id: result.rows[0].id });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du produit" });
    }
  }
);

export default router;
