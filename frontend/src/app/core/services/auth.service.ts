import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

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

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly API_URL = 'http://localhost:3000/api';
  private readonly TOKEN_KEY = 'auth_token';

  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private initialized = false;

  constructor() {
    // Ne rien faire dans le constructor pour éviter la dépendance circulaire
    // L'initialisation se fera lors du premier accès à isAuthenticated()
  }

  register(data: RegisterDTO): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, data).pipe(
      tap((response) => {
        this.setToken(response.token);
        this.currentUserSubject.next(response.user);
      }),
    );
  }

  login(data: LoginDTO): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, data).pipe(
      tap((response) => {
        this.setToken(response.token);
        this.currentUserSubject.next(response.user);
      }),
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(this.TOKEN_KEY);
      } catch (e) {
        console.warn('localStorage non disponible:', e);
      }
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    // Pendant le SSR, pas de localStorage
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      console.log('🔑 getToken appelé - Token:', token ? token.substring(0, 20) + '...' : 'null');
      return token;
    } catch (e) {
      console.warn('❌ getToken - localStorage non disponible:', e);
      return null;
    }
  }

  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.TOKEN_KEY, token);
      } catch (e) {
        console.warn('setToken - localStorage non disponible:', e);
      }
    }
  }

  isAuthenticated(): boolean {
    console.log('🛡️ isAuthenticated appelé');
    const token = this.getToken();
    console.log('🔍 Token présent:', !!token);
    
    // Initialiser l'utilisateur au premier appel si on a un token
    if (!this.initialized && token) {
      console.log('📡 Première initialisation - chargement utilisateur');
      this.initialized = true;
      // Charger l'utilisateur de manière asynchrone
      this.loadCurrentUser().subscribe({
        next: (user) => {
          console.log('✅ Utilisateur chargé:', user.username);
        },
        error: (err: HttpErrorResponse) => {
          console.error('❌ Erreur chargement:', err.status);
          if (err.status === 401) {
            if (isPlatformBrowser(this.platformId)) {
              try {
                localStorage.removeItem(this.TOKEN_KEY);
              } catch (e) {
                console.warn('removeItem - localStorage non disponible:', e);
              }
            }
            this.currentUserSubject.next(null);
          }
        }
      });
    }
    
    return !!token;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Charge les informations de l'utilisateur connecté depuis le backend
   */
  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/me`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
      })
    );
  }
}
