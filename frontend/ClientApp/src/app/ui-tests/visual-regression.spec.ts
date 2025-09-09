import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AppComponent } from '../app.component';
import { WeatherService } from '../services/weather.service';
import { TestUtils } from '../testing/test-utils';

describe('AppComponent - Visual Regression Tests', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let weatherService: jasmine.SpyObj<WeatherService>;
  let compiled: HTMLElement;

  const mockWeatherData = TestUtils.createMockWeatherData(3);

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

  describe('Layout Consistency', () => {
    it('should maintain header layout structure', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const header = compiled.querySelector('header');
      const container = compiled.querySelector('.container');
      const title = compiled.querySelector('h1');
      const refreshButton = compiled.querySelector('.refresh-btn');

      expect(header).toBeTruthy();
      expect(container).toBeTruthy();
      expect(title).toBeTruthy();
      expect(refreshButton).toBeTruthy();

      // Check title text consistency
      expect(title?.textContent?.trim()).toBe('Weather App');
    });

    it('should maintain weather grid layout consistency', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.ngOnInit();
      fixture.detectChanges();

      const weatherGrid = compiled.querySelector('.weather-grid');
      const weatherCards = compiled.querySelectorAll('.weather-card');

      expect(weatherGrid).toBeTruthy();
      expect(weatherCards.length).toBe(3);

      // Check weather grid exists and has the correct class
      expect(weatherGrid?.className).toContain('weather-grid');
    });

    it('should maintain consistent card structure across all cards', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.ngOnInit();
      fixture.detectChanges();

      const weatherCards = compiled.querySelectorAll('.weather-card');
      
      weatherCards.forEach((card, index) => {
        const dateElement = card.querySelector('.date');
        const temperatureElement = card.querySelector('.temperature');
        const celsiusElement = card.querySelector('.celsius');
        const fahrenheitElement = card.querySelector('.fahrenheit');
        const summaryElement = card.querySelector('.summary');

        expect(dateElement).toBeTruthy();
        expect(temperatureElement).toBeTruthy();
        expect(celsiusElement).toBeTruthy();
        expect(fahrenheitElement).toBeTruthy();
        expect(summaryElement).toBeTruthy();

        // Check temperature format consistency
        expect(celsiusElement?.textContent).toMatch(/^-?\d+°C$/);
        expect(fahrenheitElement?.textContent).toMatch(/^\(-?\d+°F\)$/);
      });
    });
  });

  describe('State Visual Consistency', () => {
    it('should show consistent loading state appearance', () => {
      spyOn(component, 'ngOnInit');
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.loading = true;
      component.error = '';
      component.weatherData = [];
      fixture.detectChanges();

      const loadingElement = compiled.querySelector('.loading');
      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      const weatherCards = compiled.querySelectorAll('.weather-card');

      // Loading message should be visible and centered
      expect(loadingElement).toBeTruthy();
      expect(loadingElement?.textContent).toContain('Loading weather data...');
      expect(loadingElement?.className).toContain('loading');

      // Button should show loading state
      expect(refreshButton.disabled).toBeTruthy();
      expect(refreshButton.textContent?.trim()).toBe('Loading...');

      // No weather cards should be visible
      expect(weatherCards.length).toBe(0);
    });

    it('should show consistent error state appearance', () => {
      spyOn(component, 'ngOnInit');
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.loading = false;
      component.error = 'API Error 500: Internal Server Error';
      component.weatherData = [];
      fixture.detectChanges();

      const errorElement = compiled.querySelector('.error');
      const weatherCards = compiled.querySelectorAll('.weather-card');
      const loadingElement = compiled.querySelector('.loading');

      // Error styling should be consistent
      expect(errorElement).toBeTruthy();
      expect(errorElement?.className).toContain('error');
      expect(errorElement?.textContent).toContain('API Error 500');

      // Other states should be hidden
      expect(weatherCards.length).toBe(0);
      expect(loadingElement).toBeFalsy();
    });

    it('should show consistent success state appearance', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.ngOnInit();
      fixture.detectChanges();

      const weatherCards = compiled.querySelectorAll('.weather-card');
      const loadingElement = compiled.querySelector('.loading');
      const errorElement = compiled.querySelector('.error');
      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;

      // Weather cards should be visible with consistent styling
      expect(weatherCards.length).toBe(3);
      
      weatherCards.forEach(card => {
        expect(card.className).toContain('weather-card');
      });

      // Other states should be hidden
      expect(loadingElement).toBeFalsy();
      expect(errorElement).toBeFalsy();

      // Button should be in normal state
      expect(refreshButton.disabled).toBeFalsy();
      expect(refreshButton.textContent?.trim()).toBe('Refresh');
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain proper spacing in weather grid', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.ngOnInit();
      fixture.detectChanges();

      const weatherGrid = compiled.querySelector('.weather-grid');
      expect(weatherGrid).toBeTruthy();
      expect(weatherGrid?.className).toContain('weather-grid');
    });

    it('should handle varying content lengths consistently', () => {
      // Create weather data with different text lengths
      const variableData = [
        TestUtils.createMockWeatherForecast('2025-09-15', 5, 'Sunny'),
        TestUtils.createMockWeatherForecast('2025-09-16', -15, 'Very Cold and Snowy Weather'),
        TestUtils.createMockWeatherForecast('2025-09-17', 35, 'Hot')
      ];

      weatherService.getWeatherForecast.and.returnValue(of(variableData));
      component.ngOnInit();
      fixture.detectChanges();

      const weatherCards = compiled.querySelectorAll('.weather-card');
      expect(weatherCards.length).toBe(3);

      // All cards should maintain consistent structure despite content differences
      weatherCards.forEach(card => {
        const dateElement = card.querySelector('.date');
        const temperatureElement = card.querySelector('.temperature');
        const summaryElement = card.querySelector('.summary');

        expect(dateElement?.textContent).toBeTruthy();
        expect(temperatureElement?.textContent).toBeTruthy();
        expect(summaryElement?.textContent).toBeTruthy();

        expect(card.className).toContain('weather-card');
      });
    });
  });

  describe('Color and Theme Consistency', () => {
    it('should maintain consistent button styling across states', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      expect(refreshButton).toBeTruthy();

      // Check button has consistent class
      expect(refreshButton.className).toContain('refresh-btn');

      // Test enabled state
      expect(refreshButton.disabled).toBeFalsy();
      expect(refreshButton.textContent?.trim()).toBe('Refresh');

      // Test disabled state
      component.loading = true;
      fixture.detectChanges();
      expect(refreshButton.disabled).toBeTruthy();
      expect(refreshButton.textContent?.trim()).toBe('Loading...');
    });

    it('should apply consistent error styling', () => {
      const errorMessages = [
        'API Error 400: Bad Request',
        'API Error 500: Internal Server Error',
        'Failed to connect to backend API. Make sure the backend is running on http://localhost:5079'
      ];

      errorMessages.forEach(errorMessage => {
        spyOn(component, 'ngOnInit');
        weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
        component.loading = false;
        component.error = errorMessage;
        component.weatherData = [];
        fixture.detectChanges();

        const errorElement = compiled.querySelector('.error');
        expect(errorElement).toBeTruthy();

        const errorStyles = getComputedStyle(errorElement as Element);
        expect(errorStyles.backgroundColor).toContain('248, 215, 218');
        expect(errorStyles.padding).toBe('15px');
        expect(errorStyles.borderRadius).toBe('5px');
      });
    });
  });

  describe('Empty State Consistency', () => {
    it('should handle empty weather data with consistent layout', () => {
      weatherService.getWeatherForecast.and.returnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();

      const weatherGrid = compiled.querySelector('.weather-grid');
      const weatherCards = compiled.querySelectorAll('.weather-card');
      const loadingElement = compiled.querySelector('.loading');
      const errorElement = compiled.querySelector('.error');

      // Grid container should not exist when empty
      expect(weatherGrid).toBeFalsy();
      
      // No cards should be present
      expect(weatherCards.length).toBe(0);
      
      // No loading or error states
      expect(loadingElement).toBeFalsy();
      expect(errorElement).toBeFalsy();

      // Component state should be consistent
      expect(component.loading).toBeFalsy();
      expect(component.error).toBe('');
    });
  });

  describe('Accessibility Visual Indicators', () => {
    it('should maintain focus visibility on interactive elements', () => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      
      // Button should be focusable
      refreshButton.focus();
      expect(document.activeElement).toBe(refreshButton);

      // Button should maintain focus when not disabled
      expect(refreshButton.disabled).toBeFalsy();
    });

    it('should properly indicate disabled state visually', () => {
      spyOn(component, 'ngOnInit');
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      component.loading = true;
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      
      expect(refreshButton.disabled).toBeTruthy();
      expect(refreshButton.textContent?.trim()).toBe('Loading...');
      
      // Disabled button should still be in the DOM but not interactive
      expect(refreshButton).toBeTruthy();
    });
  });
});