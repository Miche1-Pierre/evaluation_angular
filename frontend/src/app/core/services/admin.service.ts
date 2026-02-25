import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminStats {
  users: {
    total: number;
  };
  sessions: {
    active: number;
    completed: number;
    total: number;
  };
  products: {
    total: number;
  };
  themes: {
    total: number;
  };
  friendships: {
    total: number;
  };
}

export interface RecentSession {
  id: number;
  name: string;
  status: string;
  max_players: number;
  created_at: string;
  updated_at: string;
  creator_name: string;
  theme_name: string;
  theme_icon: string;
  player_count: number;
}

export interface RecentUser {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Activity {
  type: 'session_created' | 'user_registered';
  entity_id: number;
  entity_name: string;
  username: string;
  timestamp: string;
}

export interface TrendsData {
  sessions: { date: string; count: number }[];
  users: { date: string; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  /**
   * Récupère les statistiques générales de la plateforme
   */
  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Récupère les sessions récentes
   */
  getRecentSessions(limit: number = 10): Observable<RecentSession[]> {
    return this.http.get<RecentSession[]>(`${this.apiUrl}/sessions/recent`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Récupère les utilisateurs récemment inscrits
   */
  getRecentUsers(limit: number = 10): Observable<RecentUser[]> {
    return this.http.get<RecentUser[]>(`${this.apiUrl}/users/recent`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Récupère l'activité récente sur la plateforme
   */
  getActivity(limit: number = 20): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/activity`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Récupère les tendances (7 derniers jours)
   */
  getTrends(): Observable<TrendsData> {
    return this.http.get<TrendsData>(`${this.apiUrl}/stats/trends`);
  }
}
