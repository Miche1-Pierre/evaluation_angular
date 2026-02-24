import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeSignal = signal<Theme>(this.getInitialTheme());
  public readonly theme = this.themeSignal.asReadonly();

  constructor() {
    // Apply theme changes
    effect(() => {
      this.applyTheme(this.themeSignal());
    });

    // Listen to system theme changes
    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.themeSignal() === 'system') {
          this.applyTheme('system');
        }
      });
    }
  }

  private getInitialTheme(): Theme {
    if (typeof window === 'undefined') {
      return 'system';
    }
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'system';
  }

  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }

  toggleTheme(): void {
    const current = this.themeSignal();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') {
      return;
    }

    const html = document.documentElement;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const isSystem = theme === 'system';
    const isDark = theme === 'dark' || (isSystem && prefersDark);
    const resolvedTheme = isDark ? 'dark' : 'light';

    html.classList.toggle('dark', isDark);
    html.classList.toggle('dark-theme', isDark);
    html.setAttribute('data-theme', theme);
    html.style.colorScheme = resolvedTheme;
  }

  isDark(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    const theme = this.themeSignal();
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
