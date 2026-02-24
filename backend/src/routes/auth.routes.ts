import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import {
  hashPassword,
  comparePassword,
  generateToken,
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "../utils/auth.utils";
import {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  User,
  UserPayload,
} from "../types/auth.types";

const router = Router();

/**
 * POST /api/auth/register
 * Créer un nouveau compte utilisateur
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password }: RegisterDTO = req.body;

    // Validation des champs
    if (!email || !username || !password) {
      res
        .status(400)
        .json({ error: "Email, nom d'utilisateur et mot de passe sont requis" });
      return;
    }

    // Validation du format email
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Format d'email invalide" });
      return;
    }

    // Validation du username
    if (!isValidUsername(username)) {
      res.status(400).json({
        error:
          "Le nom d'utilisateur doit contenir 3-30 caractères (lettres, chiffres, espaces et symboles courants acceptés)",
      });
      return;
    }

    // Validation du mot de passe
    if (!isValidPassword(password)) {
      res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
      return;
    }

    // Vérifier si l'email existe déjà
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (emailCheck.rows.length > 0) {
      res.status(409).json({ error: "Cet email est déjà utilisé" });
      return;
    }

    // Vérifier si le username existe déjà
    const usernameCheck = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );

    if (usernameCheck.rows.length > 0) {
      res.status(409).json({ error: "Ce nom d'utilisateur est déjà utilisé" });
      return;
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur
    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, username, role`,
      [email.toLowerCase(), username, passwordHash, "user"],
    );

    const user = result.rows[0];

    // Générer le token JWT
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const token = generateToken(payload);

    // Réponse
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

/**
 * POST /api/auth/login
 * Connexion utilisateur
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginDTO = req.body;

    // Validation des champs
    if (!email || !password) {
      res.status(400).json({ error: "Email et mot de passe sont requis" });
      return;
    }

    // Récupérer l'utilisateur
    const result = await pool.query(
      "SELECT id, email, username, password_hash, role FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Email ou mot de passe incorrect" });
      return;
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({ error: "Email ou mot de passe incorrect" });
      return;
    }

    // Mettre à jour last_login
    await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    // Générer le token JWT
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const token = generateToken(payload);

    // Réponse
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

/**
 * GET /api/auth/me
 * Récupérer les infos de l'utilisateur connecté
 */
router.get("/me", async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Ajouter le middleware d'authentification pour cette route
    res.status(501).json({ error: "Not implemented yet" });
  } catch (error) {
    console.error("Error in /me:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
});

export default router;
