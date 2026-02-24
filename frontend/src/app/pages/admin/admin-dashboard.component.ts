import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, ZardButtonComponent, ZardCardComponent, ThemeToggleComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUser: User | null = null;

  // Stats pour l'admin
  readonly platformStats = [
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
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
