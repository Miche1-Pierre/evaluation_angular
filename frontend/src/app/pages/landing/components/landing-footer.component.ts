import { Component } from '@angular/core';
import { ZardDividerComponent } from '../../../shared/components/divider/divider.component';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [ZardDividerComponent],
  template: `
    <footer class="border-t bg-muted/30">
      <div class="container mx-auto px-4 py-16">
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <!-- Brand Section -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <img src="/logo.svg" alt="Pi & Rho's Games" class="w-10 h-10" />
              <span class="text-xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Pi & Rho's Games
              </span>
            </div>
            <p class="text-sm text-muted-foreground leading-relaxed">
              Le jeu ultime pour tester vos connaissances des prix et défier vos amis dans des sessions palpitantes.
            </p>
            <div class="flex gap-2">
              @for (social of socials; track social.name) {
                <a [href]="social.url" target="_blank" rel="noopener noreferrer" 
                   class="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
                  <i class="bx text-xl" [class]="social.icon"></i>
                </a>
              }
            </div>
          </div>

          <!-- Product Links -->
          <div>
            <h3 class="font-semibold text-lg mb-4">Produit</h3>
            <ul class="space-y-3">
              @for (link of productLinks; track link.label) {
                <li>
                  <a [href]="link.url" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Company Links -->
          <div>
            <h3 class="font-semibold text-lg mb-4">Entreprise</h3>
            <ul class="space-y-3">
              @for (link of companyLinks; track link.label) {
                <li>
                  <a [href]="link.url" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Legal Links -->
          <div>
            <h3 class="font-semibold text-lg mb-4">Légal</h3>
            <ul class="space-y-3">
              @for (link of legalLinks; track link.label) {
                <li>
                  <a [href]="link.url" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </div>
        </div>

        <z-divider class="my-8" />

        <div class="flex flex-col md:flex-row items-center justify-center text-sm text-muted-foreground">
          <p>&copy; 2026 Pi & Rho's Games. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LandingFooterComponent {
  readonly socials = [
    { name: 'Twitter', icon: 'bxl-twitter', url: '#' },
    { name: 'Facebook', icon: 'bxl-facebook', url: '#' },
    { name: 'Instagram', icon: 'bxl-instagram', url: '#' },
    { name: 'LinkedIn', icon: 'bxl-linkedin', url: '#' },
  ];

  readonly productLinks = [
    { label: 'Fonctionnalités', url: '#features' },
    { label: 'Comment ça marche', url: '#how-it-works' },
    { label: 'Tarifs', url: '#' },
    { label: 'FAQ', url: '#' },
    { label: 'API', url: '#' },
  ];

  readonly companyLinks = [
    { label: 'À propos', url: '#' },
    { label: 'Blog', url: '#' },
    { label: 'Carrières', url: '#' },
    { label: 'Contact', url: '#' },
  ];

  readonly legalLinks = [
    { label: 'Confidentialité', url: '#' },
    { label: 'Conditions d\'utilisation', url: '#' },
    { label: 'Cookies', url: '#' },
    { label: 'Mentions légales', url: '#' },
  ];
}
