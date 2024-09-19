// iataToStationId.ts

export const iataToStationId: { [key: string]: string } = {
    // Example entries
    'JFK': 'USW00094789',
    'LAX': 'USW00023174',
    // Add more mappings as needed
  };
  

  // weatherDataFetcher.ts

import axios from 'axios';
import { DateTime } from 'luxon';
import { iataToStationId } from './iataToStationId';

interface WeatherData {
  station: string;
  date: string;
  temperature: number | null; // In Celsius
  windSpeed: number | null; // In meters per second
  precipitation: number | null; // In millimeters
  // Add other fields as needed
}

export async function fetchHistoricalWeatherData(
  iataCode: string,
  yearsBack: number = 2
): Promise<WeatherData[]> {
  try {
    // Step 1: Map IATA code to NOAA station ID
    const stationId = iataToStationId[iataCode.toUpperCase()];

    if (!stationId) {
      throw new Error(`No NOAA station ID found for IATA code: ${iataCode}`);
    }

    // Step 2: Define date range
    const endDate = DateTime.now();
    const startDate = endDate.minus({ years: yearsBack });

    // NOAA API may limit the amount of data per request.
    // We'll fetch data month by month to handle large datasets.

    const weatherData: WeatherData[] = [];

    let currentStartDate = startDate.startOf('month');
    const finalEndDate = endDate.endOf('month');

    while (currentStartDate <= finalEndDate) {
      const currentEndDate = currentStartDate.endOf('month');

      console.log(
        `Fetching data from ${currentStartDate.toISODate()} to ${currentEndDate.toISODate()}`
      );

      const response = await axios.get(
        'https://www.ncei.noaa.gov/access/services/data/v1',
        {
          params: {
            dataset: 'global-hourly',
            stations: stationId,
            startDate: currentStartDate.toISODate(),
            endDate: currentEndDate.toISODate(),
            format: 'json',
            units: 'metric',
            // dataTypes: 'TMP,WDSP,PRCP', // Uncomment and adjust if you want specific data types
          },
          headers: {
            'User-Agent': 'YourAppName (your.email@example.com)',
            Accept: 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      const data = response.data;

      // Process and map the data
      data.forEach((entry: any) => {
        const weatherEntry: WeatherData = {
          station: entry.STATION,
          date: entry.DATE,
          temperature: entry.TMP !== undefined ? parseFloat(entry.TMP) : null,
          windSpeed: entry.WDSP !== undefined ? parseFloat(entry.WDSP) : null,
          precipitation: entry.PRCP !== undefined ? parseFloat(entry.PRCP) : null,
          // Map other fields as needed
        };

        weatherData.push(weatherEntry);
      });

      // Move to the next month
      currentStartDate = currentStartDate.plus({ months: 1 });
    }

    return weatherData;
  } catch (error) {
    console.error('Error fetching historical weather data:', error);
    throw error;
  }
}


// index.ts

import { fetchHistoricalWeatherData } from './weatherDataFetcher';

async function main() {
  try {
    const iataCode = 'JFK'; // Replace with desired IATA code
    const weatherData = await fetchHistoricalWeatherData(iataCode, 2);

    console.log(`Fetched ${weatherData.length} records for airport ${iataCode}`);
    // You can now process or store the weatherData as needed
  } catch (error) {
    console.error('Error:', error);
  }
}

main();


// buildMapping.ts

import fs from 'fs';
import csvParser from 'csv-parser';

interface MappingEntry {
  iata_code: string;
  station_id: string;
}

export async function buildIataToStationIdMapping(
  filePath: string
): Promise<{ [key: string]: string }> {
  return new Promise((resolve, reject) => {
    const mapping: { [key: string]: string } = {};

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row: MappingEntry) => {
        mapping[row.iata_code.toUpperCase()] = row.station_id;
      })
      .on('end', () => {
        console.log('Mapping file successfully processed');
        resolve(mapping);
      })
      .on('error', (error: any) => {
        console.error('Error reading mapping file:', error);
        reject(error);
      });
  });
}
