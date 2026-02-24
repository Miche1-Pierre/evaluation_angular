import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, ZardButtonComponent, ZardCardComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {
  readonly appName = "Pi & Rho's Games";
  readonly logoPath = '/assets/logo.svg';

  readonly features = [
    {
      title: 'Price Guessing Game',
      description: 'Test your market knowledge by guessing the price of 4 random products',
      icon: '💰',
    },
    {
      title: 'Smart Scoring',
      description: 'Earn points based on the accuracy of your estimates',
      icon: '🎯',
    },
    {
      title: 'Global Leaderboard',
      description: 'Compare yourself to other players and climb the rankings',
      icon: '🏆',
    },
    {
      title: 'Custom Sessions',
      description: 'Create your own sessions with varying difficulties',
      icon: '⚙️',
    },
  ];
}
