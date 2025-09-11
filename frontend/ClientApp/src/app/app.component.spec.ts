import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, from } from 'rxjs';
import { AppComponent } from './app.component';
import { WeatherService } from './services/weather.service';
import { WeatherForecast } from './models/weather-forecast';
import { TestUtils, TEST_CONSTANTS } from './testing/test-utils';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let weatherService: jasmine.SpyObj<WeatherService>;

  const mockWeatherData = TestUtils.createMockWeatherData(3);

  beforeEach(async () => {
    const weatherServiceSpy = jasmine.createSpyObj('WeatherService', ['getWeatherForecast']);

    await TestBed.configureTestingModule({
    imports: [AppComponent],
    providers: [
        { provide: WeatherService, useValue: weatherServiceSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
}).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    weatherService = TestBed.inject(WeatherService) as jasmine.SpyObj<WeatherService>;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct title', () => {
    expect(component.title).toEqual('Weather App');
  });

  it('should initialize with correct default values', () => {
    expect(component.weatherData).toEqual([]);
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('');
  });

  it('should load weather data on initialization', () => {
    weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));

    component.ngOnInit();

    expect(weatherService.getWeatherForecast).toHaveBeenCalled();
    expect(component.weatherData).toEqual(mockWeatherData);
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('');
  });

  it('should handle loading state correctly', () => {
    let resolveObservable: any;
    const observable = new Promise<WeatherForecast[]>(resolve => {
      resolveObservable = resolve;
    });
    
    weatherService.getWeatherForecast.and.returnValue(from(observable));

    expect(component.loading).toBeFalse();
    
    component.loadWeatherData();
    expect(component.loading).toBeTrue();
    
    // Resolve the observable
    resolveObservable(mockWeatherData);
  });

  it('should handle error state correctly', () => {
    const errorResponse = { status: 500, message: 'Server Error' };
    weatherService.getWeatherForecast.and.returnValue(throwError(() => errorResponse));

    component.loadWeatherData();

    expect(component.loading).toBeFalse();
    expect(component.error).toContain('API Error 500');
    expect(component.weatherData).toEqual([]);
  });

  it('should handle connection errors', () => {
    const connectionError = { status: 0 };
    weatherService.getWeatherForecast.and.returnValue(throwError(() => connectionError));

    component.loadWeatherData();

    expect(component.error).toContain('Failed to connect to backend API');
    expect(component.loading).toBeFalse();
  });

  it('should reset error state when loading new data', () => {
    component.error = 'Previous error';
    weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));

    component.loadWeatherData();

    expect(component.error).toBe('');
  });

  it('should render weather cards when data is loaded', () => {
    weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
    component.ngOnInit();
    fixture.detectChanges();

    const weatherCards = fixture.nativeElement.querySelectorAll('.weather-card');
    expect(weatherCards.length).toBe(3);
  });

  it('should render loading message when loading', () => {
    // Override ngOnInit to prevent automatic service calls
    spyOn(component, 'ngOnInit');
    weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
    
    component.loading = true;
    component.error = '';
    component.weatherData = [];
    fixture.detectChanges();

    const loadingElement = fixture.nativeElement.querySelector('.loading');
    expect(loadingElement?.textContent).toContain('Loading weather data...');
  });

  it('should render error message when there is an error', () => {
    // Override ngOnInit to prevent automatic service calls
    spyOn(component, 'ngOnInit');
    weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
    
    component.loading = false;
    component.error = 'Test error message';
    component.weatherData = [];
    fixture.detectChanges();

    const errorElement = fixture.nativeElement.querySelector('.error');
    expect(errorElement?.textContent).toContain('Test error message');
  });

  it('should enable refresh button when not loading', () => {
    // Override ngOnInit to prevent automatic service calls
    spyOn(component, 'ngOnInit');
    weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
    
    component.loading = false;
    component.error = '';
    component.weatherData = [];
    fixture.detectChanges();

    const refreshButton = fixture.nativeElement.querySelector('.refresh-btn') as HTMLButtonElement;
    expect(refreshButton.disabled).toBeFalse();
    expect(refreshButton.textContent?.trim()).toBe('Refresh');
  });

  it('should disable refresh button when loading', () => {
    // Override ngOnInit to prevent automatic service calls
    spyOn(component, 'ngOnInit');
    weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
    
    component.loading = true;
    component.error = '';
    component.weatherData = [];
    fixture.detectChanges();

    const refreshButton = fixture.nativeElement.querySelector('.refresh-btn') as HTMLButtonElement;
    expect(refreshButton.disabled).toBeTrue();
    expect(refreshButton.textContent?.trim()).toBe('Loading...');
  });

  it('should call loadWeatherData when refresh button is clicked', () => {
    spyOn(component, 'loadWeatherData');
    weatherService.getWeatherForecast.and.returnValue(of(mockWeatherData));
    fixture.detectChanges();

    const refreshButton = fixture.nativeElement.querySelector('.refresh-btn') as HTMLButtonElement;
    refreshButton.click();

    expect(component.loadWeatherData).toHaveBeenCalled();
  });

  it('should render weather card details correctly', () => {
    const singleWeatherData = [TestUtils.createMockWeatherForecast('2025-09-09', 25, 'Sunny')];
    weatherService.getWeatherForecast.and.returnValue(of(singleWeatherData));
    component.ngOnInit();
    fixture.detectChanges();

    const weatherCard = fixture.nativeElement.querySelector('.weather-card');
    const dateElement = weatherCard.querySelector('.date');
    const temperatureElement = weatherCard.querySelector('.temperature');
    const summaryElement = weatherCard.querySelector('.summary');

    expect(dateElement.textContent).toBe('2025-09-09');
    expect(temperatureElement.textContent).toContain('25°C');
    expect(temperatureElement.textContent).toContain('77°F');
    expect(summaryElement.textContent).toBe('Sunny');
  });
});
