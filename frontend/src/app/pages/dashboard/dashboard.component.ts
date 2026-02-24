import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardCardComponent, ThemeToggleComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly appName = "Pi & Rho's Games";
  
  currentUser: User | null = null;

  readonly stats = [
    { label: 'Total Score', key: 'total_score' as const, icon: '🎯' },
    { label: 'Games Played', key: 'games_played' as const, icon: '🎮' },
    { label: 'Best Session', key: 'best_session_score' as const, icon: '🏆' },
    { label: 'Average Score', key: 'average_score' as const, icon: '📊' },
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
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
