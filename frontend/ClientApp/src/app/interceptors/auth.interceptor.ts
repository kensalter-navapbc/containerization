import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  console.log('HTTP Interceptor - checking request:', req.url);
  console.log('HTTP Interceptor - token exists:', !!token);
  
  if (token && authService.isLoggedIn()) {
    console.log('HTTP Interceptor - adding Authorization header');
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }
  
  console.log('HTTP Interceptor - no token, sending request without auth');
  return next(req);
};