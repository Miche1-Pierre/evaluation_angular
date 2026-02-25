import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { GameService, LeaderboardEntry } from '../../core/services/game.service';
import { SessionsService } from '../../core/services/sessions.service';
import { AuthService } from '../../core/services/auth.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';
import { ZardBadgeComponent } from '../../shared/components/badge/badge.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

type LeaderboardTab = 'session' | 'global' | 'friends';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    RouterLink,
    ZardButtonComponent,
    ZardCardComponent,
    ZardBadgeComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css'],
})
export class LeaderboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly gameService = inject(GameService);
  private readonly sessionsService = inject(SessionsService);
  private readonly authService = inject(AuthService);

  sessionId = signal<number | null>(null);
  sessionName = signal<string>('');
  activeTab = signal<LeaderboardTab>('session');
  loading = signal(true);
  error = signal<string | null>(null);

  sessionLeaderboard = signal<LeaderboardEntry[]>([]);
  globalLeaderboard = signal<LeaderboardEntry[]>([]);
  friendsLeaderboard = signal<LeaderboardEntry[]>([]);

  currentUserId = signal<number | undefined>(undefined);

  // Leaderboard affiché selon l'onglet actif
  displayedLeaderboard = computed(() => {
    switch (this.activeTab()) {
      case 'session':
        return this.sessionLeaderboard();
      case 'global':
        return this.globalLeaderboard();
      case 'friends':
        return this.friendsLeaderboard();
      default:
        return [];
    }
  });

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId.set(user?.id);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Mode: Leaderboard d'une session spécifique
      this.sessionId.set(Number(id));
      this.activeTab.set('session');
      this.loadSession();
      this.loadSessionLeaderboard();
      // Précharger les autres onglets en arrière-plan
      this.loadGlobalLeaderboard();
      this.loadFriendsLeaderboard();
    } else {
      // Mode: Leaderboard global (pas de session spécifique)
      this.activeTab.set('global');
      this.loadGlobalLeaderboard();
      this.loadFriendsLeaderboard();
    }
  }

  private loadSession(): void {
    const id = this.sessionId();
    if (!id) return;

    this.sessionsService.getSessionById(id).subscribe({
      next: (session) => {
        this.sessionName.set(session.name);
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la session:', err);
      },
    });
  }

  private loadSessionLeaderboard(): void {
    const id = this.sessionId();
    if (!id) return;

    this.loading.set(true);
    this.gameService.getSessionLeaderboard(id).subscribe({
      next: (leaderboard) => {
        this.sessionLeaderboard.set(leaderboard);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du classement:', err);
        this.error.set('Impossible de charger le classement de la session.');
        this.loading.set(false);
      },
    });
  }

  private loadGlobalLeaderboard(): void {
    // Si l'onglet actif est global, afficher le loading
    if (this.activeTab() === 'global') {
      this.loading.set(true);
    }
    
    this.gameService.getGlobalLeaderboard(50).subscribe({
      next: (leaderboard) => {
        this.globalLeaderboard.set(leaderboard);
        if (this.activeTab() === 'global') {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du classement global:', err);
        this.error.set('Impossible de charger le classement global.');
        if (this.activeTab() === 'global') {
          this.loading.set(false);
        }
      },
    });
  }

  private loadFriendsLeaderboard(): void {
    // Si l'onglet actif est friends, afficher le loading
    if (this.activeTab() === 'friends') {
      this.loading.set(true);
    }
    
    this.gameService.getFriendsLeaderboard().subscribe({
      next: (leaderboard) => {
        this.friendsLeaderboard.set(leaderboard);
        if (this.activeTab() === 'friends') {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du classement amis:', err);
        this.error.set('Impossible de charger le classement entre amis.');
        if (this.activeTab() === 'friends') {
          this.loading.set(false);
        }
      },
    });
  }

  setActiveTab(tab: LeaderboardTab): void {
    this.activeTab.set(tab);
    this.error.set(null);
    
    // Gérer le chargement selon l'onglet sélectionné
    if (tab === 'global') {
      if (this.globalLeaderboard().length === 0) {
        this.loadGlobalLeaderboard();
      } else {
        this.loading.set(false);
      }
    } else if (tab === 'friends') {
      if (this.friendsLeaderboard().length === 0) {
        this.loadFriendsLeaderboard();
      } else {
        this.loading.set(false);
      }
    } else if (tab === 'session') {
      if (this.sessionLeaderboard().length === 0) {
        this.loadSessionLeaderboard();
      } else {
        this.loading.set(false);
      }
    }
  }

  getRankColor(rank: number): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (rank === 1) return 'default';
    if (rank === 2) return 'secondary';
    if (rank === 3) return 'outline';
    return 'outline';
  }

  getRankIcon(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  isCurrentUser(entry: LeaderboardEntry): boolean {
    return entry.user_id === this.currentUserId();
  }
}
