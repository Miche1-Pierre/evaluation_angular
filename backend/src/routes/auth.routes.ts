import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { 
  hashPassword, 
  comparePassword, 
  generateToken,
  isValidEmail,
  isValidPassword,
  isValidUsername
} from '../utils/auth.utils';
import { RegisterDTO, LoginDTO, AuthResponse, User, UserPayload } from '../types/auth.types';

const router = Router();

/**
 * POST /api/auth/register
 * Créer un nouveau compte utilisateur
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password }: RegisterDTO = req.body;

    // Validation des champs
    if (!email || !username || !password) {
      res.status(400).json({ error: 'Email, username and password are required' });
      return;
    }

    // Validation du format email
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Validation du username
    if (!isValidUsername(username)) {
      res.status(400).json({ 
        error: 'Username must be 3-20 characters, alphanumeric and underscores only' 
      });
      return;
    }

    // Validation du mot de passe
    if (!isValidPassword(password)) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Vérifier si l'email existe déjà
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (emailCheck.rows.length > 0) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    // Vérifier si le username existe déjà
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur
    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, username, role`,
      [email.toLowerCase(), username, passwordHash, 'user']
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
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * POST /api/auth/login
 * Connexion utilisateur
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginDTO = req.body;

    // Validation des champs
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Récupérer l'utilisateur
    const result = await pool.query(
      'SELECT id, email, username, password_hash, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Mettre à jour last_login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

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
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * GET /api/auth/me
 * Récupérer les infos de l'utilisateur connecté
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Ajouter le middleware d'authentification pour cette route
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    console.error('Error in /me:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
