import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { AdminService, AdminStats, RecentSession, Activity } from '../../core/services/admin.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ZardButtonComponent, ZardCardComponent, ThemeToggleComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  currentUser: User | null = null;
  stats: AdminStats | null = null;
  recentSessions: RecentSession[] = [];
  activities: Activity[] = [];
  loading = true;

  // Stats pour l'admin
  platformStats = [
    { label: 'Utilisateurs Total', value: '0', icon: 'bx-user-circle', color: 'text-blue-500' },
    { label: 'Sessions Actives', value: '0', icon: 'bx-play-circle', color: 'text-green-500' },
    { label: 'Produits', value: '0', icon: 'bx-package', color: 'text-purple-500' },
    { label: 'Parties Terminées', value: '0', icon: 'bx-check-circle', color: 'text-orange-500' },
  ];

  // Sections de gestion
  readonly managementSections = [
    {
      title: 'Gestion des Utilisateurs',
      description: 'Voir, modifier et gérer les utilisateurs',
      icon: 'bx-user',
      route: '/admin/users',
      available: false
    },
    {
      title: 'Gestion des Sessions',
      description: 'Créer et superviser les sessions de jeu',
      icon: 'bx-game',
      route: '/admin/sessions',
      available: false
    },
    {
      title: 'Gestion des Produits',
      description: 'Ajouter, modifier et supprimer des produits',
      icon: 'bx-shopping-bag',
      route: '/admin/products',
      available: false
    },
    {
      title: 'Statistiques',
      description: 'Voir les statistiques détaillées de la plateforme',
      icon: 'bx-bar-chart-alt-2',
      route: '/admin/stats',
      available: false
    },
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      
      // Vérifier que l'utilisateur est bien admin
      if (user && user.role !== 'admin') {
        this.router.navigate(['/dashboard']);
      } else if (user) {
        this.loadData();
      }
    });
  }

  private loadData(): void {
    this.loading = true;

    // Charger les statistiques
    this.adminService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.updatePlatformStats(stats);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stats:', error);
      }
    });

    // Charger les sessions récentes
    this.adminService.getRecentSessions(5).subscribe({
      next: (sessions) => {
        this.recentSessions = sessions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des sessions récentes:', error);
        this.loading = false;
      }
    });

    // Charger l'activité récente
    this.adminService.getActivity(10).subscribe({
      next: (activities) => {
        this.activities = activities;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'activité:', error);
      }
    });
  }

  private updatePlatformStats(stats: AdminStats): void {
    this.platformStats = [
      { 
        label: 'Utilisateurs Total', 
        value: stats.users.total.toString(), 
        icon: 'bx-user-circle', 
        color: 'text-blue-500' 
      },
      { 
        label: 'Sessions Actives', 
        value: stats.sessions.active.toString(), 
        icon: 'bx-play-circle', 
        color: 'text-green-500' 
      },
      { 
        label: 'Produits', 
        value: stats.products.total.toString(), 
        icon: 'bx-package', 
        color: 'text-purple-500' 
      },
      { 
        label: 'Parties Terminées', 
        value: stats.sessions.completed.toString(), 
        icon: 'bx-check-circle', 
        color: 'text-orange-500' 
      },
    ];
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'session_created':
        return 'bx-game';
      case 'user_registered':
        return 'bx-user-plus';
      default:
        return 'bx-info-circle';
    }
  }

  getActivityLabel(type: string): string {
    switch (type) {
      case 'session_created':
        return 'Nouvelle session';
      case 'user_registered':
        return 'Nouvel utilisateur';
      default:
        return 'Activité';
    }
  }

  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Il y a quelques secondes';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    
    return date.toLocaleDateString('fr-FR');
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'waiting':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'En cours';
      case 'waiting':
        return 'En attente';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
