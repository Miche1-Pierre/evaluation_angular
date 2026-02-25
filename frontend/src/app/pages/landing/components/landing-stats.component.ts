import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZardCardComponent } from '../../../shared/components/card/card.component';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-landing-stats',
  standalone: true,
  imports: [RouterLink, ZardCardComponent, ZardButtonComponent, ZardBadgeComponent],
  template: `
    <section id="stats" class="py-24 bg-muted/30">
      <div class="container mx-auto px-4">
        <!-- Stats Overview -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          @for (stat of stats; track stat.label) {
            <z-card class="text-center p-8 bg-linear-to-br from-background to-muted border-2 hover:border-primary/50 transition-all">
              <div class="inline-flex w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                <i class="bx text-3xl text-primary" [class]="stat.icon"></i>
              </div>
              <div class="text-5xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                {{ stat.value }}
              </div>
              <div class="text-sm text-muted-foreground font-medium">{{ stat.label }}</div>
            </z-card>
          }
        </div>

        <!-- Testimonials Section -->
        <div class="text-center space-y-4 mb-16">
          <z-badge zType="secondary" class="mb-4 px-4 py-1.5 text-sm font-medium">
            <i class='bx bxs-quote-alt-left text-base mr-2'></i>
            Témoignages
          </z-badge>
          <h2 class="text-4xl sm:text-5xl md:text-6xl font-bold">
            Ce que disent nos joueurs
          </h2>
          <p class="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Des milliers de joueurs s'amusent déjà, rejoignez-les !
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          @for (testimonial of testimonials; track testimonial.name) {
            <z-card class="relative overflow-hidden">
              <div class="space-y-4">
                <div class="flex text-yellow-500">
                  @for (i of [1,2,3,4,5]; track i) {
                    <i class='bx bxs-star'></i>
                  }
                </div>
                <p class="text-muted-foreground italic leading-relaxed">
                  "{{ testimonial.quote }}"
                </p>
                <div class="flex items-center gap-3 pt-2">
                  <div class="w-10 h-10 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                    {{ testimonial.avatar }}
                  </div>
                  <div>
                    <div class="font-semibold">{{ testimonial.name }}</div>
                    <div class="text-sm text-muted-foreground">{{ testimonial.role }}</div>
                  </div>
                </div>
              </div>
            </z-card>
          }
        </div>

        <!-- CTA Section -->
        <z-card class="relative overflow-hidden border-0 bg-linear-to-r from-primary to-secondary text-white">
          <div class="absolute inset-0 bg-grid-white/10"></div>
          <div class="relative text-center space-y-6 py-16 px-6">
            <h2 class="text-4xl md:text-5xl font-bold">Prêt à Relever le Défi ?</h2>
            <p class="text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
              Rejoignez des milliers de joueurs et prouvez que vous connaissez les prix mieux que quiconque
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a routerLink="/register" z-button zSize="lg" class="bg-white text-primary hover:bg-white/90 text-lg px-8 shadow-lg">
                <i class='bx bx-rocket mr-2'></i>
                Créer un Compte Gratuit
              </a>
              <a routerLink="/login" z-button zSize="lg" zType="outline" class="border-white text-black dark:text-white hover:bg-white/10 text-lg px-8">
                <i class='bx bx-log-in mr-2'></i>
                Se Connecter
              </a>
            </div>
          </div>
        </z-card>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .bg-grid-white\\/10 {
      background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
      background-size: 4rem 4rem;
    }
  `]
})
export class LandingStatsComponent {
  readonly stats = [
    {
      value: '1,234',
      label: 'Joueurs Actifs',
      icon: 'bx-user'
    },
    {
      value: '5,678',
      label: 'Parties Jouées',
      icon: 'bx-joystick'
    },
    {
      value: '890',
      label: 'Sessions Actives',
      icon: 'bx-play-circle'
    },
    {
      value: '4.9/5',
      label: 'Note Moyenne',
      icon: 'bx-star'
    },
  ];

  readonly testimonials = [
    {
      quote: 'Un jeu super addictif ! J\'adore défier mes amis et voir qui connaît le mieux les prix. Le système de scoring est vraiment bien pensé.',
      name: 'Sarah Martin',
      role: 'Joueuse passionnée',
      avatar: 'SM'
    },
    {
      quote: 'L\'interface est magnifique et intuitive. Je passe des heures à essayer de grimper dans le classement. Bravo pour ce super jeu !',
      name: 'Thomas Dubois',
      role: 'Top 10 mondial',
      avatar: 'TD'
    },
    {
      quote: 'Parfait pour animer les soirées entre amis ! On crée une session et c\'est parti pour des fous rires garantis. Hautement recommandé !',
      name: 'Julie Lambert',
      role: 'Organisatrice de soirées',
      avatar: 'JL'
    },
  ];
}
