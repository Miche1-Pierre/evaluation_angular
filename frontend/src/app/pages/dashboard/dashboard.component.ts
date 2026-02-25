import { Component, inject, OnInit, signal, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User, UserActivity } from '../../core/services/auth.service';
import { FriendsService } from '../../core/services/friends.service';
import { SessionsService, Session } from '../../core/services/sessions.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, ZardButtonComponent, ZardCardComponent, ThemeToggleComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('activityChart') activityChartRef?: ElementRef<HTMLCanvasElement>;
  
  private readonly authService = inject(AuthService);
  private readonly friendsService = inject(FriendsService);
  private readonly sessionsService = inject(SessionsService);
  private readonly router = inject(Router);

  readonly appName = "Pi & Rho's Games";
  
  currentUser: User | null = null;
  friendsCount = signal(0);
  sessionsCount = signal(0);
  pendingRequestsCount = signal(0);
  activityData = signal<UserActivity[]>([]);
  isLoadingActivity = signal(true);
  
  private chart?: Chart;

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
        this.loadActivityData();
      }
    });
  }

  private loadActivityData(): void {
    this.isLoadingActivity.set(true);
    this.authService.getActivity(14).subscribe({
      next: (data) => {
        this.activityData.set(data);
        this.isLoadingActivity.set(false);
        // Attendre le prochain cycle pour s'assurer que le canvas est disponible
        setTimeout(() => this.createChart(), 0);
      },
      error: (err) => {
        console.error('Erreur chargement activité:', err);
        this.isLoadingActivity.set(false);
      }
    });
  }

  private createChart(): void {
    if (!this.activityChartRef || this.chart) return;

    const canvas = this.activityChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const data = this.activityData();
    
    // Déterminer le thème actuel (dark ou light)
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }),
        datasets: [
          {
            label: 'Sessions complétées',
            data: data.map(d => d.sessions_completed),
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Score moyen',
            data: data.map(d => d.avg_score),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: textColor,
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor,
            },
            ticks: {
              color: textColor
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Sessions',
              color: textColor
            },
            grid: {
              color: gridColor,
            },
            ticks: {
              color: textColor,
              precision: 0
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Score moyen',
              color: textColor
            },
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              color: textColor
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
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

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  getStatValue(key: keyof User): string {
    if (!this.currentUser) return '-';
    const value = this.currentUser[key];
    if (value === null || value === undefined) return '-';
    return typeof value === 'number' ? value.toFixed(0) : String(value);
  }
}
