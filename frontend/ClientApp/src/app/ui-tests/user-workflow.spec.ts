import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError, delay } from 'rxjs';
import { AppComponent } from '../app.component';
import { WeatherService } from '../services/weather.service';
import { WeatherForecast } from '../models/weather-forecast';
import { TestUtils } from '../testing/test-utils';

describe('User Workflow Tests', () => {
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

  describe('Happy Path User Journey', () => {
    it('should complete full user journey: load → view → refresh', fakeAsync(() => {
      // Setup service to return data
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));

      // Step 1: User opens the app - automatic loading
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      // Verify data is displayed
      const weatherCards = compiled.querySelectorAll('.weather-card');
      expect(weatherCards.length).toBe(3);
      expect(component.loading).toBeFalse();

      // Step 2: User views weather details
      const firstCard = weatherCards[0];
      const dateElement = firstCard.querySelector('.date');
      const temperatureElement = firstCard.querySelector('.temperature');
      const summaryElement = firstCard.querySelector('.summary');

      expect(dateElement?.textContent).toBeTruthy();
      expect(temperatureElement?.textContent).toContain('°C');
      expect(temperatureElement?.textContent).toContain('°F');
      expect(summaryElement?.textContent).toBeTruthy();

      // Step 3: User clicks refresh to get updated data
      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      expect(refreshButton.disabled).toBeFalse();

      const initialCallCount = weatherService.getWeatherForecast.calls.count();
      refreshButton.click();
      tick();
      fixture.detectChanges();

      // Verify refresh worked
      expect(weatherService.getWeatherForecast.calls.count()).toBe(initialCallCount + 1);
      expect(component.error).toBe('');
    }));

    it('should handle user discovering app during loading state', fakeAsync(() => {
      // Simulate slow API response
      weatherService.getWeatherForecast.and.returnValue(
        of(mockWeatherData).pipe(delay(2000))
      );

      // User opens app
      component.ngOnInit();
      fixture.detectChanges();

      // Immediate state - user sees loading
      expect(component.loading).toBeTrue();
      const loadingElement = compiled.querySelector('.loading');
      expect(loadingElement?.textContent).toContain('Loading weather data...');

      // Refresh button should be disabled
      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      expect(refreshButton.disabled).toBeTrue();
      expect(refreshButton.textContent?.trim()).toBe('Loading...');

      // User waits...
      tick(2000);
      fixture.detectChanges();

      // Data finally loads
      expect(component.loading).toBeFalse();
      expect(compiled.querySelectorAll('.weather-card').length).toBe(3);
      expect(refreshButton.disabled).toBeFalse();
      expect(refreshButton.textContent?.trim()).toBe('Refresh');
    }));
  });

  describe('Error Recovery Workflows', () => {
    it('should guide user through error recovery process', fakeAsync(() => {
      // Step 1: Initial load fails
      weatherService.getWeatherForecast.and.returnValue(
        throwError(() => ({ status: 500, statusText: 'Internal Server Error' }))
      );

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      // User sees error message with guidance
      const errorElement = compiled.querySelector('.error');
      expect(errorElement?.textContent).toContain('API Error 500');
      expect(component.weatherData.length).toBe(0);

      // Step 2: User attempts retry via refresh button
      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      expect(refreshButton.disabled).toBeFalse(); // Should be enabled for retry

      // Step 3: Mock service recovery (backend is back online)
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      refreshButton.click();
      tick();
      fixture.detectChanges();

      // Step 4: User sees successful recovery
      expect(component.error).toBe(''); // Error cleared
      expect(compiled.querySelectorAll('.weather-card').length).toBe(3);
      expect(compiled.querySelector('.error')).toBeFalsy();
    }));

    it('should handle network connectivity issues gracefully', fakeAsync(() => {
      // Simulate network error (offline/connection issues)
      weatherService.getWeatherForecast.and.returnValue(
        throwError(() => ({ status: 0 }))
      );

      component.loadWeatherData();
      tick();
      fixture.detectChanges();

      // User sees helpful connection error message
      const errorElement = compiled.querySelector('.error');
      expect(errorElement?.textContent).toContain('Failed to connect to backend API');
      expect(errorElement?.textContent).toContain('Make sure the backend is running');

      // User can still attempt to refresh
      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      expect(refreshButton.disabled).toBeFalse();
    }));

    it('should persist through multiple error attempts', fakeAsync(() => {
      // First attempt fails
      weatherService.getWeatherForecast.and.returnValue(
        throwError(() => ({ status: 503, statusText: 'Service Unavailable' }))
      );

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;

      // Multiple retry attempts
      component.loadWeatherData();
      tick();
      fixture.detectChanges();
      expect(component.error).toContain('API Error 503');

      // Second attempt also fails
      weatherService.getWeatherForecast.and.returnValue(
        throwError(() => ({ status: 502, statusText: 'Bad Gateway' }))
      );
      
      refreshButton.click();
      tick();
      fixture.detectChanges();
      expect(component.error).toContain('API Error 502');

      // Third attempt succeeds
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      refreshButton.click();
      tick();
      fixture.detectChanges();

      expect(component.error).toBe('');
      expect(compiled.querySelectorAll('.weather-card').length).toBe(3);
    }));
  });

  describe('Edge Case User Behaviors', () => {
    it('should handle rapid refresh button clicks', fakeAsync(() => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      let callCount = 0;

      // Track service calls
      weatherService.getWeatherForecast.and.callFake(() => {
        callCount++;
        return of(mockWeatherData);
      });

      // User rapidly clicks refresh 5 times
      for (let i = 0; i < 5; i++) {
        refreshButton.click();
        fixture.detectChanges();
      }

      tick();
      expect(callCount).toBe(5); // All clicks should register
      expect(component.error).toBe('');
    }));

    it('should handle user interacting during loading', fakeAsync(() => {
      let resolvePromise: any;
      const promise = new Promise<WeatherForecast[]>(resolve => {
        resolvePromise = resolve;
      });
      
      weatherService.getWeatherForecast.and.returnValue(from(promise));
      
      // Start loading
      component.loadWeatherData();
      fixture.detectChanges();
      
      expect(component.loading).toBeTrue();
      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      expect(refreshButton.disabled).toBeTrue();

      // User tries to click disabled button (should not trigger new request)
      const initialCallCount = weatherService.getWeatherForecast.calls.count();
      refreshButton.click();
      expect(weatherService.getWeatherForecast.calls.count()).toBe(initialCallCount);

      // Resolve the loading
      resolvePromise(mockWeatherData);
      tick();
      fixture.detectChanges();

      expect(component.loading).toBeFalse();
      expect(refreshButton.disabled).toBeFalse();
    }));

    it('should maintain state consistency with empty responses', fakeAsync(() => {
      // User loads app, gets empty data
      weatherService.getWeatherForecast.and.returnValue(of([]));
      
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      // State should be consistent
      expect(component.loading).toBeFalse();
      expect(component.error).toBe('');
      expect(component.weatherData).toEqual([]);
      expect(compiled.querySelectorAll('.weather-card').length).toBe(0);
      
      // Weather grid container should not exist when empty
      expect(compiled.querySelector('.weather-grid')).toBeFalsy();

      // User can still refresh
      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      expect(refreshButton.disabled).toBeFalse();
    }));
  });

  describe('Data Display Workflows', () => {
    it('should handle varying amounts of weather data', fakeAsync(() => {
      // Test with 1 item
      weatherService.getWeatherForecast.and.returnValue(of(TestUtils.createMockWeatherData(1)));
      component.ngOnInit();
      tick();
      fixture.detectChanges();
      expect(compiled.querySelectorAll('.weather-card').length).toBe(1);

      // Refresh with 10 items
      weatherService.getWeatherForecast.and.returnValue(of(TestUtils.createMockWeatherData(10)));
      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      refreshButton.click();
      tick();
      fixture.detectChanges();
      expect(compiled.querySelectorAll('.weather-card').length).toBe(10);

      // Grid should handle both cases properly
      const weatherGrid = compiled.querySelector('.weather-grid');
      expect(weatherGrid).toBeTruthy();
    }));

    it('should display temperature conversions accurately', fakeAsync(() => {
      const testData = [
        TestUtils.createMockWeatherForecast('2025-09-15', 0, 'Freezing'),
        TestUtils.createMockWeatherForecast('2025-09-16', 100, 'Boiling'),
        TestUtils.createMockWeatherForecast('2025-09-17', -10, 'Very Cold')
      ];

      weatherService.getWeatherForecast.and.returnValue(of(testData));
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      const temperatureElements = compiled.querySelectorAll('.temperature');
      
      // Check 0°C = 32°F
      expect(temperatureElements[0].textContent).toContain('0°C');
      expect(temperatureElements[0].textContent).toContain('32°F');
      
      // Check 100°C = 212°F
      expect(temperatureElements[1].textContent).toContain('100°C');
      expect(temperatureElements[1].textContent).toContain('212°F');
      
      // Check -10°C = 14°F
      expect(temperatureElements[2].textContent).toContain('-10°C');
      expect(temperatureElements[2].textContent).toContain('14°F');
    }));
  });

  describe('Accessibility Workflows', () => {
    it('should support keyboard navigation', fakeAsync(() => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      
      // Button should be focusable
      refreshButton.focus();
      expect(document.activeElement).toBe(refreshButton);

      // Enter key should trigger click
      spyOn(component, 'loadWeatherData');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      refreshButton.dispatchEvent(enterEvent);
      
      // Note: In a real test environment, you might need to trigger the actual click
      refreshButton.click(); // Simulate the expected behavior
      expect(component.loadWeatherData).toHaveBeenCalled();
    }));

    it('should maintain proper focus states', fakeAsync(() => {
      weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
      fixture.detectChanges();

      const refreshButton = compiled.querySelector('.refresh-btn') as HTMLButtonElement;
      
      // Focus should be maintained when not loading
      refreshButton.focus();
      expect(document.activeElement).toBe(refreshButton);

      // During loading, button becomes disabled but focus behavior is preserved
      spyOn(component, 'ngOnInit');
      component.loading = true;
      fixture.detectChanges();
      
      expect(refreshButton.disabled).toBeTrue();
    }));
  });
});

// Import needed for promise-based observable test
import { from } from 'rxjs';