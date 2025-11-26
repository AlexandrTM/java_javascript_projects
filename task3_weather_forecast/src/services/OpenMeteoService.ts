import axios from 'axios';
import { IWeatherService, IGeoData, IWeatherData } from '../interfaces';

export class OpenMeteoService implements IWeatherService {
    
    private async getCoordinates(city: string): Promise<IGeoData> {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
        const response = await axios.get(url);
        
        if (!response.data.results || response.data.results.length === 0) {
            throw new Error(`City '${city}' not found`);
        }

        const { name, latitude, longitude } = response.data.results[0];
        return { name, latitude, longitude };
    }

    private async getForecast(lat: number, lon: number): Promise<IWeatherData> {
        // Берем прогноз на два дня, т.к. нам нужно 24 ближайших часа, непросто 24 часа текущего дня
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&forecast_days=2`;
        const response = await axios.get(url);
        
        const { time, temperature_2m } = response.data.hourly;

        // Находим текущий час в формате ISO
        const now = new Date();
        const isoHour = now.toISOString().slice(0, 13) + ":00"; 

        const startIndex = time.indexOf(isoHour);
        if (startIndex === -1) {
            throw new Error("Current hour not found in Open-Meteo data");
        }

        // Берем 24 часа начиная от текущего часа
        const next24HoursTime = time.slice(startIndex, startIndex + 24);
        const next24HoursTemperature = temperature_2m.slice(startIndex, startIndex + 24);

        return {
            time: next24HoursTime,
            temperature: next24HoursTemperature
        };
    }

    public async getWeather(city: string): Promise<IWeatherData> {
        const coords = await this.getCoordinates(city);
        return await this.getForecast(coords.latitude, coords.longitude);
    }
}