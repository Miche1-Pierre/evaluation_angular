import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.currentUser$.pipe(
    map(user => {
      if (user?.role === 'admin') {
        return true;
      }
      router.navigate(['/dashboard']);
      return false;
    })
  );
};
