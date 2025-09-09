import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { AppComponent } from '../app.component';
import { WeatherService } from '../services/weather.service';
import { WeatherForecast } from '../models/weather-forecast';
import { TestUtils, TEST_CONSTANTS } from '../testing/test-utils';

describe('AppComponent - UI Integration Tests', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let weatherService: jasmine.SpyObj<WeatherService>;
  let compiled: HTMLElement;

  const mockWeatherData = TestUtils.createMockWeatherData(5);

  beforeEach(async () => {
    const weatherServiceSpy = jasmine.createSpyObj('WeatherService', ['getWeatherForecast']);

    await TestBed.configureTestingModule({
      imports: [AppComponent, HttpClientTestingModule],
      providers: [
        { provide: WeatherService, useValue: weatherServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    weatherService = TestBed.inject(WeatherService) as jasmine.SpyObj<WeatherService>;
    compiled = fixture.nativeElement;
  });

  describe('Initial UI State', () => {
    it('should display the correct title', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const titleElement = compiled.querySelector('h1');
      expect(titleElement?.textContent?.trim()).toBe('Weather App');
    });

    it('should show refresh button on initial load', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      expect(refreshButton).toBeTruthy();
      expect(refreshButton.textContent?.trim()).toBe('Refresh');
    });

    it('should not show loading state initially', () => {
      // Prevent automatic loading
      spyOn(component, 'ngOnInit');
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const loadingElement = compiled.querySelector('.loading');
      expect(loadingElement).toBeFalsy();
    });
  });

  describe('Loading State UI', () => {
    it('should show loading message and disable button when loading', () => {
      // Simulate loading state
      spyOn(component, 'ngOnInit');
      component.loading = true;
      component.error = '';
      component.weatherData = [];
      fixture.detectChanges();

      const loadingElement = compiled.querySelector('.loading');
      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;

      expect(loadingElement?.textContent).toContain('Loading weather data...');
      expect(refreshButton.disabled).toBeTruthy();
      expect(refreshButton.textContent?.trim()).toBe('Loading...');
    });

    it('should hide weather cards when loading', () => {
      spyOn(component, 'ngOnInit');
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.loading = true;
      component.error = '';
      component.weatherData = [];
      fixture.detectChanges();

      const weatherCards = compiled.querySelectorAll('.weather-card');
      expect(weatherCards.length).toBe(0);
    });

    it('should show loading indicator with proper styling', () => {
      spyOn(component, 'ngOnInit');
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.loading = true;
      fixture.detectChanges();

      const loadingElement = compiled.querySelector('.loading');
      expect(loadingElement).toBeTruthy();
      expect(loadingElement?.textContent).toContain('Loading weather data...');
    });
  });

  describe('Success State UI', () => {
    it('should display weather cards when data is loaded', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.ngOnInit();
      fixture.detectChanges();

      const weatherCards = compiled.querySelectorAll('.weather-card');
      expect(weatherCards.length).toBe(5);
    });

    it('should display correct weather card structure', () => {
      const singleWeatherData = [TestUtils.createMockWeatherForecast('2025-09-15', 22, 'Sunny')];
      weatherService.getWeatherForecast.and.returnValue(of(singleWeatherData));
      component.ngOnInit();
      fixture.detectChanges();

      const weatherCard = compiled.querySelector('.weather-card');
      const dateElement = weatherCard?.querySelector('.date');
      const temperatureElement = weatherCard?.querySelector('.temperature');
      const celsiusElement = weatherCard?.querySelector('.celsius');
      const fahrenheitElement = weatherCard?.querySelector('.fahrenheit');
      const summaryElement = weatherCard?.querySelector('.summary');

      expect(dateElement?.textContent).toBe('2025-09-15');
      expect(celsiusElement?.textContent).toBe('22°C');
      expect(fahrenheitElement?.textContent).toBe('(72°F)');
      expect(summaryElement?.textContent).toBe('Sunny');
    });

    it('should apply grid layout to weather cards', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.ngOnInit();
      fixture.detectChanges();

      const weatherGrid = compiled.querySelector('.weather-grid');
      expect(weatherGrid).toBeTruthy();
      expect(weatherGrid?.className).toContain('weather-grid');
    });

    it('should hide loading and error messages when data is displayed', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.ngOnInit();
      fixture.detectChanges();

      const loadingElement = compiled.querySelector('.loading');
      const errorElement = compiled.querySelector('.error');
      
      expect(loadingElement).toBeFalsy();
      expect(errorElement).toBeFalsy();
    });
  });

  describe('Error State UI', () => {
    it('should display error message when API fails', () => {
      const errorMessage = 'API Error 500: Internal Server Error';
      weatherService.getWeatherForecast.and.returnValue(
        throwError(() => ({ status: 500, statusText: 'Internal Server Error' }))
      );
      
      component.loadWeatherData();
      fixture.detectChanges();

      const errorElement = compiled.querySelector('.error');
      expect(errorElement?.textContent).toContain('API Error 500');
    });

    it('should show connection error message with helpful text', () => {
      weatherService.getWeatherForecast.and.returnValue(
        throwError(() => ({ status: 0 }))
      );
      
      component.loadWeatherData();
      fixture.detectChanges();

      const errorElement = compiled.querySelector('.error');
      expect(errorElement?.textContent).toContain('Failed to connect to backend API');
      expect(errorElement?.textContent).toContain('Make sure the backend is running');
    });

    it('should apply error styling', () => {
      spyOn(component, 'ngOnInit');
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.error = 'Test error message';
      component.loading = false;
      component.weatherData = [];
      fixture.detectChanges();

      const errorElement = compiled.querySelector('.error') as HTMLElement;
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error message');
      expect(errorElement.className).toContain('error');
    });

    it('should hide weather cards when error is shown', () => {
      weatherService.getWeatherForecast.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server Error' }))
      );
      
      component.loadWeatherData();
      fixture.detectChanges();

      const weatherCards = compiled.querySelectorAll('.weather-card');
      const errorElement = compiled.querySelector('.error');
      
      expect(weatherCards.length).toBe(0);
      expect(errorElement).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should trigger data reload when refresh button is clicked', () => {
      spyOn(component, 'loadWeatherData').and.callThrough();
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      refreshButton.click();

      expect(component.loadWeatherData).toHaveBeenCalled();
    });

    it('should show loading state immediately after refresh click', (done) => {
      let resolveObservable: any;
      const observable = new Promise<WeatherForecast[]>(resolve => {
        resolveObservable = resolve;
      });
      
      weatherService.getWeatherForecast.and.returnValue(from(observable));
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      refreshButton.click();
      fixture.detectChanges();

      // Check loading state
      expect(component.loading).toBeTruthy();
      const loadingElement = compiled.querySelector('.loading');
      expect(loadingElement?.textContent).toContain('Loading weather data...');
      
      // Resolve and finish test
      resolveObservable(mockWeatherData);
      setTimeout(() => {
        fixture.detectChanges();
        expect(component.loading).toBeFalsy();
        done();
      }, 10);
    });

    it('should clear previous error when refresh is clicked', () => {
      component.error = 'Previous error message';
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      refreshButton.click();

      expect(component.error).toBe('');
    });

    it('should disable refresh button during loading', () => {
      spyOn(component, 'ngOnInit');
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.loading = true;
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      expect(refreshButton.disabled).toBeTruthy();
      expect(refreshButton.textContent?.trim()).toBe('Loading...');
    });
  });

  describe('Responsive Design Elements', () => {
    it('should have proper container structure', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const container = compiled.querySelector('.container');
      const header = compiled.querySelector('header');
      
      expect(container).toBeTruthy();
      expect(header).toBeTruthy();
    });

    it('should have weather cards with hover effects', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.ngOnInit();
      fixture.detectChanges();

      const firstCard = compiled.querySelector('.weather-card') as HTMLElement;
      expect(firstCard).toBeTruthy();
      
      const styles = getComputedStyle(firstCard);
      expect(styles.borderRadius).toBe('10px');
      expect(styles.padding).toBe('20px');
    });

    it('should display temperature in both Celsius and Fahrenheit', () => {
      const weatherData = [TestUtils.createMockWeatherForecast('2025-09-15', 25, 'Warm')];
      weatherService.getWeatherForecast.and.returnValue(of(weatherData));
      component.ngOnInit();
      fixture.detectChanges();

      const temperatureElement = compiled.querySelector('.temperature');
      expect(temperatureElement?.textContent).toContain('25°C');
      expect(temperatureElement?.textContent).toContain('77°F');
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty weather data gracefully', () => {
      weatherService.getWeatherForecast.and.returnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();

      const weatherCards = compiled.querySelectorAll('.weather-card');
      const loadingElement = compiled.querySelector('.loading');
      const errorElement = compiled.querySelector('.error');

      expect(weatherCards.length).toBe(0);
      expect(loadingElement).toBeFalsy();
      expect(errorElement).toBeFalsy();
      expect(component.loading).toBeFalsy();
    });

    it('should not show weather grid container when empty', () => {
      weatherService.getWeatherForecast.and.returnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();

      const weatherGrid = compiled.querySelector('.weather-grid');
      expect(weatherGrid).toBeFalsy();
    });
  });

  describe('Performance and Accessibility', () => {
    it('should have accessible button attributes', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      expect(refreshButton.type).toBe('button');
      expect(refreshButton.getAttribute('disabled')).toBeNull();
    });

    it('should have proper heading hierarchy', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const h1Element = compiled.querySelector('h1');
      expect(h1Element).toBeTruthy();
      expect(h1Element?.textContent).toContain('Weather App');
    });

    it('should handle rapid successive clicks gracefully', () => {
      spyOn(component, 'loadWeatherData').and.callThrough();
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      
      // Simulate rapid clicks
      refreshButton.click();
      refreshButton.click();
      refreshButton.click();

      expect(component.loadWeatherData).toHaveBeenCalledTimes(3);
    });
  });
});

// Need to import 'from' for the promise-based observable test
import { from } from 'rxjs';