/**
 * Types partagés pour l'application Pi & Rho's Games
 */

// ============================================
// User & Auth
// ============================================
export interface User {
  id: number;
  email: string;
  username: string;
  role: 'user' | 'admin';
  total_score: number;
  games_played: number;
  best_session_score: number | null;
  average_score: number | null;
  created_at: string;
  last_login: string;
}

// ============================================
// Products
// ============================================
export interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Sessions
// ============================================
export type SessionStatus = 'active' | 'completed' | 'archived';
export type SessionDifficulty = 'easy' | 'medium' | 'hard';
export type SessionVisibility = 'public' | 'private' | 'friends_only';

export interface Session {
  id: number;
  name: string;
  creator_id: number;
  status: SessionStatus;
  difficulty: SessionDifficulty;
  visibility: SessionVisibility;
  max_participants: number | null;
  created_at: string;
  updated_at: string;
  creator_username?: string;
  creator_email?: string;
  participant_count?: number;
}

export interface Participant {
  id: number;
  session_id: number;
  user_id: number;
  session_score: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
  username?: string;
  email?: string;
}

// ============================================
// Game & Scoring
// ============================================
export interface SessionProduct {
  id: number;
  name: string;
  image_url: string | null;
  position: number;
}

export interface Answer {
  id: number;
  participant_id: number;
  product_id: number;
  guessed_price: number;
  score: number;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  email: string;
  session_score?: number;
  participant_id?: number;
  completed?: boolean;
  answers_count?: number;
  total_score?: number;
  games_played?: number;
  best_session_score?: number;
  average_score?: number;
  is_me?: boolean;
}

// ============================================
// Friends
// ============================================
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface Friend {
  user_id: number;
  username: string;
  email: string;
  total_score: number;
  games_played: number;
  best_session_score: number;
  became_friends_at: string;
}

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
  sender_username?: string;
  sender_email?: string;
  receiver_username?: string;
  receiver_email?: string;
}

// ============================================
// Invites
// ============================================
export type InviteStatus = 'pending' | 'accepted' | 'rejected';

export interface Invite {
  id: number;
  session_id: number;
  inviter_id: number;
  invitee_id: number;
  status: InviteStatus;
  created_at: string;
  updated_at: string;
  session_name?: string;
  difficulty?: string;
  visibility?: string;
  session_status?: string;
  max_participants?: number;
  inviter_username?: string;
  inviter_email?: string;
  invitee_username?: string;
  invitee_email?: string;
}

export interface SessionInvite {
  id: number;
  session_id: number;
  inviter_id: number;
  invitee_id: number;
  status: InviteStatus;
  created_at: string;
  updated_at: string;
  invitee_username?: string;
  invitee_email?: string;
}
