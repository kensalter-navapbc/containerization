import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, AuthResponse, User, RegisterRequest } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkExistingAuth();
  }

  private checkExistingAuth(): void {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      this.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        },
        error: () => {
          this.logout();
        }
      });
    }
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    console.log('Attempting login with:', loginRequest.email);
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, loginRequest)
      .pipe(
        tap(response => {
          console.log('Login successful, response:', response);
          this.handleAuthResponse(response);
        })
      );
  }

  register(registerRequest: RegisterRequest): Observable<AuthResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, registerRequest, { headers })
      .pipe(
        tap(response => {
          // Registration success, but don't auto-login as it requires admin privileges
          console.log('User registered successfully');
        })
      );
  }

  getCurrentUser(): Observable<User> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get<User>(`${this.baseUrl}/me`, { headers });
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const isValid = token !== null && !this.isTokenExpired(token);
    console.log('isLoggedIn check - token exists:', !!token, 'isValid:', isValid);
    return isValid;
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUserValue();
    return user ? roles.includes(user.role) : false;
  }

  private handleAuthResponse(response: AuthResponse): void {
    console.log('handleAuthResponse - storing token and user data');
    localStorage.setItem('auth_token', response.token);
    
    const user: User = {
      id: '', // Will be populated when we call getCurrentUser
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
      createdAt: new Date().toISOString() // Placeholder
    };
    
    localStorage.setItem('auth_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    
    console.log('Authentication state updated - token saved, user set');

    // Get the complete user profile
    this.getCurrentUser().subscribe({
      next: (fullUser) => {
        console.log('Complete user profile retrieved:', fullUser);
        localStorage.setItem('auth_user', JSON.stringify(fullUser));
        this.currentUserSubject.next(fullUser);
      },
      error: (error) => {
        console.error('Failed to get complete user profile:', error);
      }
    });
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const isExpired = now > expirationTime;
      
      console.log('Token expiration check:', {
        now: new Date(now),
        expirationTime: new Date(expirationTime),
        isExpired
      });
      
      return isExpired;
    } catch (error) {
      console.error('Invalid token format', error);
      return true;
    }
  }
}