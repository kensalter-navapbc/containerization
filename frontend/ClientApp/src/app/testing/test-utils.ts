import { WeatherForecast } from '../models/weather-forecast';

export class TestUtils {
  /**
   * Creates mock weather forecast data for testing
   */
  static createMockWeatherData(count: number = 3): WeatherForecast[] {
    const summaries = ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Windy', 'Hot', 'Cold', 'Mild'];
    const mockData: WeatherForecast[] = [];

    for (let i = 0; i < count; i++) {
      const tempC = Math.floor(Math.random() * 40) - 10; // -10 to 30 Celsius
      const tempF = Math.round(tempC * 9/5 + 32);
      
      mockData.push({
        date: this.getDateString(i + 1),
        temperatureC: tempC,
        temperatureF: tempF,
        summary: summaries[Math.floor(Math.random() * summaries.length)]
      });
    }

    return mockData;
  }

  /**
   * Creates a single mock weather forecast
   */
  static createMockWeatherForecast(
    date: string = '2025-09-09',
    temperatureC: number = 25,
    summary: string = 'Sunny'
  ): WeatherForecast {
    return {
      date,
      temperatureC,
      temperatureF: Math.round(temperatureC * 9/5 + 32),
      summary
    };
  }

  /**
   * Creates malformed weather data for error testing
   */
  static createMalformedWeatherData(): any[] {
    return [
      {
        date: '2025-09-09',
        temperatureC: 'not-a-number',
        temperatureF: 77,
        summary: 'Sunny'
      },
      {
        date: null,
        temperatureC: 20,
        temperatureF: 68,
        summary: 'Cloudy'
      },
      {
        // Missing required fields
        temperatureC: 15
      }
    ];
  }

  /**
   * Gets a date string for testing (YYYY-MM-DD format)
   */
  private static getDateString(daysFromToday: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return date.toISOString().split('T')[0];
  }

  /**
   * Simulates network delay for async testing
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Creates HTTP error response for testing
   */
  static createHttpError(status: number, message: string) {
    return {
      status,
      statusText: this.getStatusText(status),
      error: message,
      message: `Http failure response for test: ${status} ${this.getStatusText(status)}`
    };
  }

  private static getStatusText(status: number): string {
    const statusTexts: { [key: number]: string } = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    return statusTexts[status] || 'Unknown Error';
  }
}

/**
 * Common test data and constants
 */
export const TEST_CONSTANTS = {
  API_ENDPOINTS: {
    WEATHER_FORECAST: '/api/weatherforecast'
  },
  HTTP_STATUS: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },
  MOCK_RESPONSES: {
    EMPTY_ARRAY: [],
    NETWORK_ERROR: new ProgressEvent('network error'),
    TIMEOUT_ERROR: new ProgressEvent('timeout')
  }
};