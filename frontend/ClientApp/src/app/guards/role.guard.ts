import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(requiredRoles?: string[]): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);
      if (!hasRequiredRole) {
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    return true;
  }

  canActivateChild(requiredRoles?: string[]): boolean {
    return this.canActivate(requiredRoles);
  }
}