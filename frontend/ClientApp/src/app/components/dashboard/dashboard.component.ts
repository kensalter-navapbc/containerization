import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WeatherService } from '../../services/weather.service';
import { User } from '../../models/auth.models';
import { WeatherForecast } from '../../models/weather-forecast';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  weatherData: WeatherForecast[] = [];
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private weatherService: WeatherService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.loadWeatherData();
  }

  loadWeatherData(): void {
    this.loading = true;
    this.error = '';
    
    this.weatherService.getWeatherForecast().subscribe({
      next: (data) => {
        this.weatherData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Weather API Error:', err);
        if (err.status === 401) {
          this.error = 'Authentication required. Please log in again.';
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (err.status === 0) {
          this.error = 'Failed to connect to backend API. Make sure the backend is running.';
        } else if (err.status) {
          this.error = `API Error ${err.status}: ${err.statusText || err.message}`;
        } else {
          this.error = 'Failed to load weather data: ' + (err.message || 'Unknown error');
        }
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserDisplayName(): string {
    if (this.currentUser?.firstName || this.currentUser?.lastName) {
      return `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim();
    }
    return this.currentUser?.email || 'User';
  }

  getRoleBadgeClass(): string {
    switch (this.currentUser?.role?.toLowerCase()) {
      case 'admin': return 'role-admin';
      case 'user': return 'role-user';
      case 'guest': return 'role-guest';
      default: return 'role-default';
    }
  }
}