import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZardButtonComponent } from '../button/button.component';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';
import { NgTemplateOutlet } from '@angular/common';

export interface NavLink {
  label: string;
  href?: string;
  routerLink?: string;
}

export interface ActionButton {
  label: string;
  icon?: string;
  routerLink?: string;
  type?: 'default' | 'outline' | 'ghost';
  onClick?: () => void;
  hidden?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ZardButtonComponent, ThemeToggleComponent, NgTemplateOutlet],
  template: `
    <header class="border-b sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 py-4">
        <nav class="flex items-center justify-between">
          <!-- Logo -->
          <a [routerLink]="logoLink()" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="Pi & Rho's Games" class="w-10 h-10" />
            <span class="text-2xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
              Pi & Rho's Games
            </span>
          </a>

          <!-- Nav Links (Desktop) -->
          @if (navLinks().length > 0) {
            <div class="hidden md:flex items-center gap-8">
              @for (link of navLinks(); track link.label) {
                @if (link.href) {
                  <a [href]="link.href" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {{ link.label }}
                  </a>
                }
                @if (link.routerLink) {
                  <a [routerLink]="link.routerLink" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {{ link.label }}
                  </a>
                }
              }
            </div>
          }

          <!-- Actions -->
          <div class="flex items-center gap-3">
            @if (showThemeToggle()) {
              <app-theme-toggle />
            }
            
            @for (button of actionButtons(); track button.label) {
              @if (!button.hidden) {
                @if (button.routerLink) {
                  <a 
                    [routerLink]="button.routerLink" 
                    z-button 
                    [zType]="button.type || 'default'"
                    [class.hidden]="button.hidden"
                    [class.sm:inline-flex]="button.hidden === undefined">
                    @if (button.icon) {
                      <i [class]="'bx ' + button.icon + ' mr-2'"></i>
                    }
                    {{ button.label }}
                  </a>
                } @else if (button.onClick) {
                  <button 
                    z-button 
                    [zType]="button.type || 'default'"
                    (click)="button.onClick()"
                    [class.hidden]="button.hidden">
                    @if (button.icon) {
                      <i [class]="'bx ' + button.icon + ' mr-2'"></i>
                    }
                    {{ button.label }}
                  </button>
                }
              }
            }
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
export class AppHeaderComponent {
  logoLink = input<string>('/');
  navLinks = input<NavLink[]>([]);
  actionButtons = input<ActionButton[]>([]);
  showThemeToggle = input<boolean>(true);
}
