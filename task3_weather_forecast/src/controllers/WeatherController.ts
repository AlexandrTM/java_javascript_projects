import { Request, Response } from 'express';
import { ICacheService, IWeatherService } from '../interfaces';

export class WeatherController {
    constructor(
        private weatherService: IWeatherService,
        private cacheService: ICacheService
    ) {}

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
                console.log(`Fetching data for ${city} from Redis...`);
            }

            // Визуализация через HTML
            const html = this.generateHtml(city, weatherData, source);
            res.send(html);

        } catch (error: any) {
            res.status(500).send(`Error: ${error.message}`);
        }
    };

    private generateHtml(city: string, data: any, source: string): string {
        // Простая HTML страница с Chart.js
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Weather in ${city}</title>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <style>
                    body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                    .badge { background: ${source === 'Cache' ? '#28a745' : '#007bff'}; color: white; padding: 5px 10px; border-radius: 4px; }
                </style>
            </head>
            <body>
                <h1>Weather Forecast: ${city}</h1>
                <p>Data source: <span class="badge">${source}</span></p>
                <canvas id="weatherChart"></canvas>
                <script>
                    const ctx = document.getElementById('weatherChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ${JSON.stringify(data.time.map((t: string) => t.split('T')[1]))},
                            datasets: [{
                                label: 'Temperature (°C)',
                                data: ${JSON.stringify(data.temperature)},
                                borderColor: 'rgb(75, 192, 192)',
                                tension: 0.1,
                                fill: true
                            }]
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}