import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Pendant le SSR, laisser passer - la vérification se fera côté client après hydratation
  if (!isPlatformBrowser(platformId)) {
    return true;
  }
  
  const isAuth = authService.isAuthenticated();
  
  if (isAuth) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};
