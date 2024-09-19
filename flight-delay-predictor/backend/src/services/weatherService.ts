import axios from 'axios';

const AVIATIONSTACK_API_KEY = 'YOUR_AVIATIONSTACK_API_KEY';

interface AirportCoordinates {
  latitude: number;
  longitude: number;
}

export async function getAirportCoordinates(iataCode: string): Promise<AirportCoordinates> {
  try {
    const response = await axios.get('http://api.aviationstack.com/v1/airports', {
      params: {
        access_key: AVIATIONSTACK_API_KEY,
        iata_code: iataCode,
      },
    });

    const airportData = response.data.data[0];

    if (!airportData) {
      throw new Error(`No data found for IATA code: ${iataCode}`);
    }

    return {
      latitude: parseFloat(airportData.latitude),
      longitude: parseFloat(airportData.longitude),
    };
  } catch (error) {
    console.error('Error fetching airport coordinates:', error);
    throw error;
  }
}

interface NOAAForecast {
  temperature: number;
  temperatureUnit: string;
  detailedForecast: string;
  startTime: string;
}

export async function getWeatherForecastNOAA(
  latitude: number,
  longitude: number
): Promise<NOAAForecast[]> {
  try {
    // Get the grid points for the given latitude and longitude
    const gridResponse = await axios.get(
      `https://api.weather.gov/points/${latitude},${longitude}`,
      {
        headers: {
          'User-Agent': 'YourAppName (your.email@example.com)',
          Accept: 'application/geo+json',
        },
      }
    );

    const { gridId, gridX, gridY } = gridResponse.data.properties;

    // Get the forecast for the grid point
    const forecastResponse = await axios.get(
      `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`,
      {
        headers: {
          'User-Agent': 'YourAppName (your.email@example.com)',
          Accept: 'application/geo+json',
        },
      }
    );

    const periods = forecastResponse.data.properties.periods;

    const forecasts = periods.map((period: any) => ({
      temperature: period.temperature,
      temperatureUnit: period.temperatureUnit,
      detailedForecast: period.detailedForecast,
      startTime: period.startTime,
    }));

    return forecasts;
  } catch (error) {
    console.error('Error fetching weather forecast from NOAA:', error);
    throw error;
  }
}

// Define or import getWeatherForecastOpenWeatherMap function
async function getWeatherForecastOpenWeatherMap(latitude: number, longitude: number) {
  // Implementation for OpenWeatherMap forecast
  return []; // Placeholder return
}

async function getAirportWeatherForecast(iataCode: string) {
  try {
    // Step 1: Get airport coordinates
    const { latitude, longitude } = await getAirportCoordinates(iataCode);

    // Step 2: Get weather forecasts from both APIs
    const [openWeatherMapForecast, noaaForecast] = await Promise.all([
      getWeatherForecastOpenWeatherMap(latitude, longitude),
      getWeatherForecastNOAA(latitude, longitude),
    ]);

    // Step 3: Process or combine forecasts as needed
    console.log('OpenWeatherMap Forecast:', openWeatherMapForecast);
    console.log('NOAA Forecast:', noaaForecast);
  } catch (error) {
    console.error('Error getting airport weather forecast:', error);
  }
}

// Example usage:
getAirportWeatherForecast('JFK');
