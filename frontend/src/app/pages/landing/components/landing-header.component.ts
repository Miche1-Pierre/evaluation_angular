import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-landing-header',
  standalone: true,
  imports: [RouterLink, ZardButtonComponent, ThemeToggleComponent],
  template: `
    <header class="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 py-4">
        <nav class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <img src="/logo.svg" alt="Pi & Rho's Games" class="w-10 h-10" />
              <span class="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Pi & Rho's Games
              </span>
            </div>
          </div>

          <div class="hidden md:flex items-center gap-8">
            <a href="#features" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#how-it-works" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Comment ça marche
            </a>
            <a href="#stats" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Statistiques
            </a>
          </div>

          <div class="flex items-center gap-3">
            <app-theme-toggle />
            <a routerLink="/login" z-button zType="ghost" class="hidden sm:inline-flex">
              Connexion
            </a>
            <a routerLink="/register" z-button>
              Inscription
            </a>
          </div>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LandingHeaderComponent {}
