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
        // Получаем данные на 24 часа (обычно API отдает больше, фильтруем при необходимости)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&forecast_days=1`;
        const response = await axios.get(url);
        
        const { time, temperature_2m } = response.data.hourly;

        return {
            time: time,
            temperature: temperature_2m
        };
    }

    // Основной публичный метод
    public async getWeather(city: string): Promise<IWeatherData> {
        const coords = await this.getCoordinates(city);
        return await this.getForecast(coords.latitude, coords.longitude);
    }
}