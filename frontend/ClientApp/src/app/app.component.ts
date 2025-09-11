import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WeatherService } from './services/weather.service';
import { WeatherForecast } from './models/weather-forecast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Weather App';
  weatherData: WeatherForecast[] = [];
  loading = false;
  error = '';

  constructor(private weatherService: WeatherService) {}

  ngOnInit(): void {
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
      error: (error) => {
        this.loading = false;
        
        if (error.status === 0) {
          this.error = 'Failed to connect to backend API. Make sure the backend is running';
        } else if (error.status === 500) {
          this.error = 'API Error 500. Internal server error occurred';
        } else if (error.status === 502) {
          this.error = 'API Error 502. Bad gateway error';
        } else if (error.status === 503) {
          this.error = 'API Error 503. Service temporarily unavailable';
        } else {
          this.error = 'Failed to load weather data';
        }
      }
    });
  }
}
