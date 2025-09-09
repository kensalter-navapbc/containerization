import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WeatherForecast } from '../models/weather-forecast';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = 'api/weather/forecast';

  constructor(private http: HttpClient) { }

  getWeatherForecast(): Observable<WeatherForecast[]> {
    console.log('WeatherService - making request to:', this.apiUrl);
    return this.http.get<WeatherForecast[]>(this.apiUrl);
  }
}
