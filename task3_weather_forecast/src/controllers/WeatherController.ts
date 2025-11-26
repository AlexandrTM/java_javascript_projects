import { Request, Response } from 'express';
import { ICacheService, IWeatherService } from '../interfaces';
import * as fs from 'fs';
import * as path from 'path';

export class WeatherController {
    private weatherHtmlTemplate: string;

    constructor(
        private weatherService: IWeatherService,
        private cacheService: ICacheService
    ) {
        try {
            const templatePath = path.join(__dirname, '..', 'views', 'weather.html');
            this.weatherHtmlTemplate = fs.readFileSync(templatePath, 'utf-8');
        } catch (error) {
            console.error('ERROR: Could not read weather.html template file.', error);
            // Если шаблон не найден, используем пустую строку, чтобы избежать падения сервера
            this.weatherHtmlTemplate = '<h1>Error loading template.</h1>'; 
        }
    }

    public getWeather = async (req: Request, res: Response): Promise<void> => {
        try {
            const city = req.query.city as string;
            if (!city) {
                res.status(400).send('Please provide a city name');
                return;
            }

            const cacheKey = `weather:${city.toLowerCase()}`;
            
            // Пытаемся достать прогноз погоды из кэша
            let weatherData = await this.cacheService.get<any>(cacheKey);
            let source = 'Cache';

            // Если нет в кэше, идем в API
            if (!weatherData) {
                console.log(`Fetching data for ${city} from API...`);
                weatherData = await this.weatherService.getWeather(city);
                
                // Сохраняем в кеше на 15 минут (900 секунд)
                await this.cacheService.set(cacheKey, weatherData, 900);
                source = 'API';
            } else {
                console.log(`Fetching data for ${city} from cache...`);
            }

            // Визуализация через HTML
            const html = this.generateHtml(city, weatherData, source);
            res.send(html);

        } catch (error: any) {
            res.status(500).send(`Error: ${error.message}`);
        }
    };

    private generateHtml(city: string, data: any, source: string): string {
        const isCache = source === 'Cache';
        
        let html = this.weatherHtmlTemplate.replace(/{{CITY}}/g, city);
        
        // Информация об источнике
        html = html.replace('{{SOURCE_TEXT}}', source);
        html = html.replace('{{SOURCE_BADGE_CLASS}}', isCache ? 'cache-badge' : 'api-badge');

        // Данные для Chart.js
        // Используем Intl.DateTimeFormat для получения локализованного сокращения дня недели
        const dayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
        let lastDay: number | null = null;
        const labels = JSON.stringify(
            data.time.map((t: string) => {
                const date = new Date(t);
                const timePart = t.split('T')[1]; // Получаем "HH:MM:SSZ"
                const hourMinute = timePart.substring(0, 5); // Оставляем только "HH:MM"
                
                // Сокращения для дней недели
                let dayLabel = "";
                const currentDay = date.getDate();
                if (lastDay === null || currentDay !== lastDay) {
                    dayLabel = ` (${dayFormatter.format(date)})`;
                    lastDay = currentDay;
                }

                // Возвращаем метку в формате "ЧЧ:ММ (День)"
                return `${hourMinute}${dayLabel}`;
            })
        );   
        const temperatures = JSON.stringify(data.temperature);
        
        html = html.replace('{{LABELS}}', labels);
        html = html.replace('{{DATA}}', temperatures);

        return html;
    }
}