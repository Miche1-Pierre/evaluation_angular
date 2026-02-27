import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Invite {
  id: number;
  session_id: number;
  inviter_id: number;
  invitee_id: number;
  status: 'pending' | 'accepted' | 'rejected';
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

@Injectable({
  providedIn: 'root',
})
export class InvitesService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';

  /**
   * Récupère les invitations reçues
   * @param status - Filtre optionnel: 'pending' | 'accepted' | 'rejected'
   */
  getMyInvites(status?: 'pending' | 'accepted' | 'rejected'): Observable<Invite[]> {
    const url = status
      ? `${this.API_URL}/invites?status=${status}`
      : `${this.API_URL}/invites`;
    return this.http.get<Invite[]>(url);
  }

  /**
   * Récupère les invitations envoyées
   */
  getSentInvites(): Observable<Invite[]> {
    return this.http.get<Invite[]>(`${this.API_URL}/invites/sent`);
  }

  /**
   * Accepte une invitation (rejoint automatiquement la session)
   */
  acceptInvite(inviteId: number): Observable<{ message: string; participant: any }> {
    return this.http.post<{ message: string; participant: any }>(
      `${this.API_URL}/invites/${inviteId}/accept`,
      {}
    );
  }

  /**
   * Rejette une invitation
   */
  rejectInvite(inviteId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/invites/${inviteId}/reject`,
      {}
    );
  }

  /**
   * Annule/supprime une invitation (inviter ou admin)
   */
  deleteInvite(inviteId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/invites/${inviteId}`);
  }
}
