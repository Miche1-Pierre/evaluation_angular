import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SessionProduct {
  id: number;
  name: string;
  image_url: string | null;
  position: number;
}

export interface SubmitAnswerDTO {
  product_id: number;
  guessed_price: number;
}

export interface AnswerResponse {
  message: string;
  answer: {
    id: number;
    participant_id: number;
    product_id: number;
    guessed_price: number;
    score: number;
    created_at: string;
  };
  score: number;
  actual_price: number;
  session_score: number;
  completed: boolean;
  answers_count: number;
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

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';

  /**
   * Récupère les 4 produits d'une session SANS les prix
   * Accessible uniquement aux participants
   */
  getSessionProducts(sessionId: number): Observable<SessionProduct[]> {
    return this.http.get<SessionProduct[]>(`${this.API_URL}/sessions/${sessionId}/products`);
  }

  /**
   * Soumet une estimation de prix
   * Calcule automatiquement le score: 100 - |guessed_price - actual_price|
   */
  submitAnswer(sessionId: number, data: SubmitAnswerDTO): Observable<AnswerResponse> {
    return this.http.post<AnswerResponse>(`${this.API_URL}/sessions/${sessionId}/answer`, data);
  }

  /**
   * Récupère le classement d'une session
   */
  getSessionLeaderboard(sessionId: number): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.API_URL}/sessions/${sessionId}/leaderboard`);
  }

  /**
   * Récupère le classement global
   * @param limit - Nombre de résultats (défaut: 50, max: 100)
   */
  getGlobalLeaderboard(limit: number = 50): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.API_URL}/leaderboard/global?limit=${limit}`);
  }

  /**
   * Récupère le classement entre amis
   * Inclut l'utilisateur connecté + tous ses amis
   */
  getFriendsLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.API_URL}/leaderboard/friends`);
  }
}
