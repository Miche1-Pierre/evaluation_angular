import { Request } from 'express';

// Enums
export type UserRole = 'user' | 'admin';
export type SessionStatus = 'active' | 'completed' | 'archived';
export type SessionDifficulty = 'easy' | 'medium' | 'hard';

// Types pour l'authentification
export interface UserPayload {
  id: number;
  email: string;
  username: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

// DTOs pour les requêtes
export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

// Réponses
export interface AuthResponse {
  user: {
    id: number;
    email: string;
    username: string;
    role: string;
  };
  token: string;
}

export interface UserStats {
  total_score: number;
  games_played: number;
  best_session_score: number;
  average_score: number;
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  total_score: number;
  games_played: number;
  best_session_score: number;
  average_score: number;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface Session {
  id: number;
  name: string;
  creator_id: number;
  status: SessionStatus;
  difficulty: SessionDifficulty;
  created_at: Date;
  updated_at: Date;
}
