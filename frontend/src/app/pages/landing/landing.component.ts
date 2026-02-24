import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, ZardButtonComponent, ZardCardComponent, ThemeToggleComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {
  readonly appName = "Pi & Rho's Games";
  readonly logoPath = 'logo.svg';

  readonly features = [
    {
      title: 'Devinez les Prix',
      description: 'Testez vos connaissances du marché en devinant le prix de 4 produits aléatoires',
      icon: 'bx-dollar-circle',
    },
    {
      title: 'Scoring Intelligent',
      description: 'Gagnez des points en fonction de la précision de vos estimations',
      icon: 'bx-target-lock',
    },
    {
      title: 'Classement Global',
      description: 'Comparez-vous aux autres joueurs et grimpez dans le leaderboard',
      icon: 'bx-trophy',
    },
    {
      title: 'Sessions Personnalisées',
      description: 'Créez vos propres sessions avec des difficultés variées',
      icon: 'bx-cog',
    },
  ];
}
