import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Session {
  id: number;
  name: string;
  creator_id: number;
  status: 'active' | 'completed' | 'archived';
  difficulty: 'easy' | 'medium' | 'hard';
  visibility: 'public' | 'private' | 'friends_only';
  max_participants: number | null;
  created_at: string;
  updated_at: string;
  creator_username?: string;
  creator_email?: string;
  participant_count?: number;
}

export interface CreateSessionDTO {
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  visibility: 'public' | 'private' | 'friends_only';
  max_participants?: number;
  product_ids: number[]; // Les 4 produits sélectionnés
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

export interface SessionInvite {
  id: number;
  session_id: number;
  inviter_id: number;
  invitee_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  invitee_username?: string;
  invitee_email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SessionsService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';

  /**
   * Crée une nouvelle session
   */
  createSession(data: CreateSessionDTO): Observable<Session> {
    return this.http.post<{ message: string; session: Session }>(`${this.API_URL}/sessions`, data).pipe(
      map(response => response.session)
    );
  }

  /**
   * Récupère une session par ID
   */
  getSessionById(id: number): Observable<Session> {
    return this.http.get<Session>(`${this.API_URL}/sessions/${id}`);
  }

  /**
   * Récupère les sessions actives (filtrées par visibilité)
   */
  getActiveSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.API_URL}/sessions`);
  }

  /**
   * Récupère les sessions créées par l'utilisateur connecté
   */
  getMyCreatedSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.API_URL}/sessions/my/created`);
  }

  /**
   * Récupère les sessions où l'utilisateur participe
   */
  getMyParticipations(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.API_URL}/sessions/my/participating`);
  }

  /**
   * Rejoint une session
   */
  joinSession(sessionId: number): Observable<{ message: string; participant: Participant }> {
    return this.http.post<{ message: string; participant: Participant }>(
      `${this.API_URL}/sessions/${sessionId}/join`,
      {}
    );
  }

  /**
   * Récupère les participants d'une session
   */
  getSessionParticipants(sessionId: number): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.API_URL}/sessions/${sessionId}/participants`);
  }

  /**
   * Supprime une session (créateur ou admin)
   */
  deleteSession(sessionId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/sessions/${sessionId}`);
  }

  /**
   * Invite un utilisateur à la session
   */
  inviteToSession(sessionId: number, userEmail: string): Observable<{ message: string; invite: SessionInvite }> {
    return this.http.post<{ message: string; invite: SessionInvite }>(
      `${this.API_URL}/sessions/${sessionId}/invite`,
      { user_email: userEmail }
    );
  }

  /**
   * Récupère les invitations d'une session (créateur uniquement)
   */
  getSessionInvites(sessionId: number): Observable<SessionInvite[]> {
    return this.http.get<SessionInvite[]>(`${this.API_URL}/sessions/${sessionId}/invites`);
  }
}
