import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { FriendsService } from '../../core/services/friends.service';
import { SessionsService, Session } from '../../core/services/sessions.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, ZardButtonComponent, ZardCardComponent, ThemeToggleComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly friendsService = inject(FriendsService);
  private readonly sessionsService = inject(SessionsService);
  private readonly router = inject(Router);

  readonly appName = "Pi & Rho's Games";
  
  currentUser: User | null = null;
  friendsCount = signal(0);
  sessionsCount = signal(0);
  pendingRequestsCount = signal(0);

  readonly stats = [
    { label: 'Total Score', key: 'total_score' as const, icon: '🎯' },
    { label: 'Games Played', key: 'games_played' as const, icon: '🎮' },
    { label: 'Best Session', key: 'best_session_score' as const, icon: '🏆' },
    { label: 'Average Score', key: 'average_score' as const, icon: '📊' },
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.loadDashboardData();
      }
    });
  }

  private loadDashboardData(): void {
    // Charger le nombre d'amis
    this.friendsService.getFriendsList().subscribe({
      next: (friends: any) => this.friendsCount.set(friends.length),
      error: (err: any) => console.error('Erreur chargement amis:', err)
    });

    // Charger le nombre de demandes en attente
    this.friendsService.getPendingRequests().subscribe({
      next: (requests: any) => this.pendingRequestsCount.set(requests.length),
      error: (err: any) => console.error('Erreur chargement demandes:', err)
    });

    // Charger les sessions de l'utilisateur
    if (this.currentUser) {
      this.sessionsService.getActiveSessions().subscribe({
        next: (sessions: Session[]) => {
          const userSessions = sessions.filter((s: Session) => 
            s.creator_id === this.currentUser?.id
          );
          this.sessionsCount.set(userSessions.length);
        },
        error: (err: any) => console.error('Erreur chargement sessions:', err)
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getStatValue(key: keyof User): string {
    if (!this.currentUser) return '-';
    const value = this.currentUser[key];
    if (value === null || value === undefined) return '-';
    return typeof value === 'number' ? value.toFixed(0) : String(value);
  }
}
