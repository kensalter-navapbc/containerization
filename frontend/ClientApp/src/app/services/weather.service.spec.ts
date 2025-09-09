import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WeatherService } from './weather.service';
import { WeatherForecast } from '../models/weather-forecast';
import { TestUtils, TEST_CONSTANTS } from '../testing/test-utils';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;

  const mockWeatherData: WeatherForecast[] = TestUtils.createMockWeatherData(3);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WeatherService]
    });
    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve weather forecast from API', () => {
    service.getWeatherForecast().subscribe(data => {
      expect(data).toEqual(mockWeatherData);
      expect(data.length).toBe(3);
    });

    const req = httpMock.expectOne(TEST_CONSTANTS.API_ENDPOINTS.WEATHER_FORECAST);
    expect(req.request.method).toBe('GET');
    req.flush(mockWeatherData);
  });

  it('should handle empty response', () => {
    service.getWeatherForecast().subscribe(data => {
      expect(data).toEqual(TEST_CONSTANTS.MOCK_RESPONSES.EMPTY_ARRAY);
      expect(data.length).toBe(0);
    });

    const req = httpMock.expectOne(TEST_CONSTANTS.API_ENDPOINTS.WEATHER_FORECAST);
    expect(req.request.method).toBe('GET');
    req.flush(TEST_CONSTANTS.MOCK_RESPONSES.EMPTY_ARRAY);
  });

  it('should handle HTTP error response', () => {
    const errorMessage = 'Failed to load weather data';

    service.getWeatherForecast().subscribe({
      next: () => fail('Expected an error, not weather data'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.error).toBe(errorMessage);
      }
    });

    const req = httpMock.expectOne(TEST_CONSTANTS.API_ENDPOINTS.WEATHER_FORECAST);
    expect(req.request.method).toBe('GET');
    req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle network error', () => {
    service.getWeatherForecast().subscribe({
      next: () => fail('Expected a network error'),
      error: (error) => {
        expect(error.error instanceof ProgressEvent).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(TEST_CONSTANTS.API_ENDPOINTS.WEATHER_FORECAST);
    expect(req.request.method).toBe('GET');
    req.error(new ProgressEvent('network error'));
  });

  it('should call the correct API endpoint', () => {
    service.getWeatherForecast().subscribe();

    const req = httpMock.expectOne(TEST_CONSTANTS.API_ENDPOINTS.WEATHER_FORECAST);
    expect(req.request.url).toBe('/api/weatherforecast');
    req.flush(mockWeatherData);
  });

  it('should return observable with correct data types', () => {
    service.getWeatherForecast().subscribe(data => {
      expect(Array.isArray(data)).toBeTruthy();
      
      if (data.length > 0) {
        const firstItem = data[0];
        expect(typeof firstItem.date).toBe('string');
        expect(typeof firstItem.temperatureC).toBe('number');
        expect(typeof firstItem.temperatureF).toBe('number');
        expect(typeof firstItem.summary).toBe('string');
      }
    });

    const req = httpMock.expectOne(TEST_CONSTANTS.API_ENDPOINTS.WEATHER_FORECAST);
    req.flush(mockWeatherData);
  });

  it('should handle malformed data gracefully', () => {
    const malformedData = TestUtils.createMalformedWeatherData();

    service.getWeatherForecast().subscribe(data => {
      expect(data).toEqual(malformedData);
      // Service should still return the data, validation can be handled at component level
    });

    const req = httpMock.expectOne(TEST_CONSTANTS.API_ENDPOINTS.WEATHER_FORECAST);
    req.flush(malformedData);
  });

  it('should handle large datasets', () => {
    const largeDataset = TestUtils.createMockWeatherData(100);

    service.getWeatherForecast().subscribe(data => {
      expect(data.length).toBe(100);
      expect(Array.isArray(data)).toBeTruthy();
    });

    const req = httpMock.expectOne(TEST_CONSTANTS.API_ENDPOINTS.WEATHER_FORECAST);
    req.flush(largeDataset);
  });

  it('should handle different HTTP status codes', () => {
    const testCases = [
      { status: 400, message: 'Bad Request' },
      { status: 401, message: 'Unauthorized' },
      { status: 404, message: 'Not Found' },
      { status: 503, message: 'Service Unavailable' }
    ];

    testCases.forEach(({ status, message }) => {
      service.getWeatherForecast().subscribe({
        next: () => fail(`Expected error for status ${status}`),
        error: (error) => {
          expect(error.status).toBe(status);
        }
      });

      const req = httpMock.expectOne(TEST_CONSTANTS.API_ENDPOINTS.WEATHER_FORECAST);
      req.flush(message, { status, statusText: message });
    });
  });
});
