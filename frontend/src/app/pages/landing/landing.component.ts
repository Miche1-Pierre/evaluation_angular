import { Component } from '@angular/core';
import { LandingHeaderComponent } from './components/landing-header.component';
import { LandingHeroComponent } from './components/landing-hero.component';
import { LandingFeaturesComponent } from './components/landing-features.component';
import { LandingStatsComponent } from './components/landing-stats.component';
import { LandingFooterComponent } from './components/landing-footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    LandingHeaderComponent,
    LandingHeroComponent,
    LandingFeaturesComponent,
    LandingStatsComponent,
    LandingFooterComponent
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {}
