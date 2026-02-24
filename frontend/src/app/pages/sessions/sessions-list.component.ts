import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { SessionsService, Session } from '../../core/services/sessions.service';
import { AuthService } from '../../core/services/auth.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';
import { ZardBadgeComponent } from '../../shared/components/badge/badge.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-sessions-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    DatePipe,
    ZardButtonComponent,
    ZardCardComponent,
    ZardBadgeComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './sessions-list.component.html',
  styleUrls: ['./sessions-list.component.css'],
})
export class SessionsListComponent implements OnInit {
  private readonly sessionsService = inject(SessionsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  sessions = signal<Session[]>([]);
  mySessions = signal<Session[]>([]);
  myParticipations = signal<Session[]>([]);
  loading = signal(true);
  activeTab = signal<'all' | 'my-created' | 'my-participations'>('all');
  
  // Filtres
  searchQuery = signal('');
  selectedDifficulty = signal<'all' | 'easy' | 'medium' | 'hard'>('all');
  selectedVisibility = signal<'all' | 'public' | 'private' | 'friends_only'>('all');

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading.set(true);

    // Charger toutes les sessions actives
    this.sessionsService.getActiveSessions().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading sessions:', err);
        this.loading.set(false);
      },
    });

    // Charger mes sessions créées
    this.sessionsService.getMyCreatedSessions().subscribe({
      next: (sessions) => this.mySessions.set(sessions),
      error: (err) => console.error('Error loading my sessions:', err),
    });

    // Charger mes participations
    this.sessionsService.getMyParticipations().subscribe({
      next: (sessions) => this.myParticipations.set(sessions),
      error: (err) => console.error('Error loading participations:', err),
    });
  }

  get filteredSessions(): Session[] {
    let sessions: Session[] = [];

    // Sélectionner les sessions selon l'onglet actif
    switch (this.activeTab()) {
      case 'all':
        sessions = this.sessions();
        break;
      case 'my-created':
        sessions = this.mySessions();
        break;
      case 'my-participations':
        sessions = this.myParticipations();
        break;
    }

    // Filtrer par recherche
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      sessions = sessions.filter((s) =>
        s.name.toLowerCase().includes(query) ||
        s.creator_username?.toLowerCase().includes(query)
      );
    }

    // Filtrer par difficulté
    if (this.selectedDifficulty() !== 'all') {
      sessions = sessions.filter((s) => s.difficulty === this.selectedDifficulty());
    }

    // Filtrer par visibilité
    if (this.selectedVisibility() !== 'all') {
      sessions = sessions.filter((s) => s.visibility === this.selectedVisibility());
    }

    return sessions;
  }

  setActiveTab(tab: 'all' | 'my-created' | 'my-participations'): void {
    this.activeTab.set(tab);
  }

  joinSession(sessionId: number): void {
    this.sessionsService.joinSession(sessionId).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadSessions(); // Recharger pour mettre à jour les compteurs
        this.router.navigate(['/sessions', sessionId, 'play']);
      },
      error: (err) => {
        const errorMessage = err.error?.error || 'Erreur lors de la connexion à la session';
        alert(errorMessage);
      },
    });
  }

  playSession(sessionId: number): void {
    this.router.navigate(['/sessions', sessionId, 'play']);
  }

  getDifficultyColor(difficulty: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (difficulty) {
      case 'easy':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'hard':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  getVisibilityIcon(visibility: string): string {
    switch (visibility) {
      case 'public':
        return 'bx-globe';
      case 'private':
        return 'bx-lock';
      case 'friends_only':
        return 'bx-group';
      default:
        return 'bx-help-circle';
    }
  }

  getStatusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'outline';
      case 'archived':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
