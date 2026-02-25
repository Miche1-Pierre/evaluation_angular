import { Component } from '@angular/core';
import { ZardCardComponent } from '../../../shared/components/card/card.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';

interface Feature {
  title: string;
  description: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-landing-features',
  standalone: true,
  imports: [ZardCardComponent, ZardBadgeComponent],
  template: `
    <section id="features" class="py-24 bg-muted/30">
      <div class="container mx-auto px-4">
        <div class="text-center space-y-4 mb-16">
          <z-badge zType="secondary" class="mb-4 px-4 py-1.5 text-sm font-medium">
            <i class='bx bxs-grid-alt text-base mr-2'></i>
            Fonctionnalités
          </z-badge>
          <h2 class="text-4xl sm:text-5xl md:text-6xl font-bold">
            Tout ce dont vous avez besoin
          </h2>
          <p class="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Une expérience de jeu complète avec des fonctionnalités innovantes pour maximiser votre plaisir
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          @for (feature of features; track feature.title) {
            <z-card class="relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border-2 hover:border-primary/50">
              <div class="space-y-4">
                <div class="flex items-start justify-between">
                  <div class="w-14 h-14 rounded-xl bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <i class="bx text-4xl text-primary" [class]="feature.icon"></i>
                  </div>
                  @if (feature.badge) {
                    <z-badge zType="default" class="text-xs">
                      {{ feature.badge }}
                    </z-badge>
                  }
                </div>
                <div>
                  <h3 class="text-xl font-semibold mb-2">{{ feature.title }}</h3>
                  <p class="text-muted-foreground leading-relaxed">{{ feature.description }}</p>
                </div>
              </div>
            </z-card>
          }
        </div>
      </div>
    </section>

    <section id="how-it-works" class="py-24">
      <div class="container mx-auto px-4">
        <div class="text-center space-y-4 mb-16">
          <z-badge zType="secondary" class="mb-4 px-4 py-1.5 text-sm font-medium">
            <i class='bx bxs-compass text-base mr-2'></i>
            Comment ça marche
          </z-badge>
          <h2 class="text-4xl sm:text-5xl md:text-6xl font-bold">
            Simple comme bonjour
          </h2>
          <p class="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Commencez à jouer en quelques secondes
          </p>
        </div>

        <div class="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          @for (step of steps; track step.number) {
            <div class="relative text-center">
              @if (step.number < 4) {
                <div class="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-linear-to-r from-primary to-secondary -z-10"></div>
              }
              <div class="inline-flex w-24 h-24 rounded-full bg-linear-to-br from-primary to-secondary items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                {{ step.number }}
              </div>
              <h3 class="text-xl font-semibold mb-2">{{ step.title }}</h3>
              <p class="text-muted-foreground">{{ step.description }}</p>
            </div>
          }
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
export class LandingFeaturesComponent {
  readonly features: Feature[] = [
    {
      title: 'Devinez les Prix',
      description: 'Testez vos connaissances du marché en devinant le prix de 4 produits aléatoires. Plus vous êtes précis, plus vous gagnez de points !',
      icon: 'bx-dollar-circle',
      badge: 'Populaire'
    },
    {
      title: 'Scoring Intelligent',
      description: 'Notre système de points récompense la précision. Obtenez le score maximum en devinant au centime près !',
      icon: 'bx-target-lock',
    },
    {
      title: 'Classement Global',
      description: 'Comparez-vous aux meilleurs joueurs du monde et suivez votre progression dans le leaderboard en temps réel',
      icon: 'bx-trophy',
    },
    {
      title: 'Sessions Multijoueur',
      description: 'Créez des sessions privées et invitez vos amis pour des duels épiques de devinettes de prix',
      icon: 'bx-group',
      badge: 'Nouveau'
    },
    {
      title: 'Thèmes Personnalisés',
      description: 'Choisissez parmi différents thèmes de produits : électronique, mode, alimentation, et bien plus encore',
      icon: 'bx-palette',
    },
    {
      title: 'Statistiques Détaillées',
      description: 'Analysez vos performances avec des graphiques et des statistiques complètes pour vous améliorer',
      icon: 'bx-bar-chart-alt-2',
    },
  ];

  readonly steps = [
    {
      number: 1,
      title: 'Inscription',
      description: 'Créez votre compte en quelques secondes'
    },
    {
      number: 2,
      title: 'Rejoignez',
      description: 'Choisissez ou créez une session de jeu'
    },
    {
      number: 3,
      title: 'Devinez',
      description: 'Estimez le prix des produits affichés'
    },
    {
      number: 4,
      title: 'Gagnez',
      description: 'Accumulez des points et grimpez au classement'
    },
  ];
}
