import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [ZardButtonComponent],
  template: `
    <button 
      z-button 
      zType="ghost" 
      zSize="sm"
      (click)="toggleTheme()"
      [attr.aria-label]="isDark ? 'Activer le mode clair' : 'Activer le mode sombre'"
      class="p-2!"
    >
      <i class="bx text-xl" [class]="isDark ? 'bx-sun' : 'bx-moon'"></i>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  get isDark(): boolean {
    return this.themeService.isDark();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
