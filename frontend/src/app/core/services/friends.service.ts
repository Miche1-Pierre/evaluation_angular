import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender_username?: string;
  sender_email?: string;
  receiver_username?: string;
  receiver_email?: string;
}

export interface SendFriendRequestDTO {
  receiver_email?: string;
  receiver_username?: string;
  receiver_id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';

  /**
   * Récupère la liste de tous les amis
   */
  getFriendsList(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.API_URL}/friends`);
  }

  /**
   * Envoie une demande d'ami
   */
  sendFriendRequest(data: SendFriendRequestDTO): Observable<{ message: string; request: FriendRequest }> {
    return this.http.post<{ message: string; request: FriendRequest }>(
      `${this.API_URL}/friends/request`,
      data
    );
  }

  /**
   * Récupère les demandes reçues en attente
   */
  getPendingRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.API_URL}/friends/requests`);
  }

  /**
   * Récupère les demandes envoyées en attente
   */
  getSentRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.API_URL}/friends/requests/sent`);
  }

  /**
   * Accepte une demande d'ami
   */
  acceptFriendRequest(requestId: number): Observable<{ message: string; friendship: any }> {
    return this.http.post<{ message: string; friendship: any }>(
      `${this.API_URL}/friends/requests/${requestId}/accept`,
      {}
    );
  }

  /**
   * Rejette une demande d'ami
   */
  rejectFriendRequest(requestId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/friends/requests/${requestId}/reject`,
      {}
    );
  }

  /**
   * Supprime un ami de la liste
   */
  removeFriend(friendId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/friends/${friendId}`);
  }

  /**
   * Annule une demande d'ami envoyée
   */
  deleteFriendRequest(requestId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/friends/request/${requestId}`);
  }
}
