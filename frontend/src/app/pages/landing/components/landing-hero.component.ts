import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [RouterLink, ZardButtonComponent, ZardBadgeComponent],
  template: `
    <section class="relative overflow-hidden">
      <!-- Background gradients -->
      <div class="absolute inset-0 -z-10 overflow-hidden">
        <div class="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-30">
          <div class="aspect-1155/678 w-288.75 bg-linear-to-tr from-primary to-secondary"></div>
        </div>
      </div>

      <div class="container mx-auto px-4 py-24 sm:py-32">
        <div class="max-w-4xl mx-auto text-center space-y-8">
          <!-- Badge -->
          <div class="flex justify-center">
            <z-badge zType="secondary" class="px-4 py-1.5 text-sm font-medium">
              <i class='bx bxs-zap text-base mr-2'></i>
              Nouveau : Mode Multijoueur en Temps Réel
            </z-badge>
          </div>

          <!-- Main heading -->
          <div class="space-y-4">
            <h1 class="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
              Devinez les Prix,
              <span class="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Gagnez des Points
              </span>
            </h1>
            <p class="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Testez vos connaissances du marché dans un jeu captivant où précision rime avec victoire.
              Affrontez vos amis et grimpez dans le classement mondial !
            </p>
          </div>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a routerLink="/register" z-button zSize="lg" class="text-lg px-8 shadow-lg hover:shadow-xl transition-shadow">
              <i class='bx bx-rocket mr-2'></i>
              Commencer Gratuitement
            </a>
            <a routerLink="/login" z-button zSize="lg" zType="outline" class="text-lg px-8">
              <i class='bx bx-log-in mr-2'></i>
              Se Connecter
            </a>
          </div>

          <!-- Social Proof -->
          <div class="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
            <div class="flex items-center gap-2">
              <div class="flex -space-x-2">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="w-8 h-8 rounded-full border-2 border-background bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold">
                    {{i}}
                  </div>
                }
              </div>
              <span class="font-medium">+1,200 joueurs actifs</span>
            </div>
            <div class="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/30"></div>
            <div class="flex items-center gap-2">
              <div class="flex text-yellow-500">
                @for (i of [1,2,3,4,5]; track i) {
                  <i class='bx bxs-star'></i>
                }
              </div>
              <span class="font-medium">4.9/5 (500+ avis)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LandingHeroComponent {}
