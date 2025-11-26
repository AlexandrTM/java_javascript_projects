import express from 'express';
import { WeatherController } from './controllers/WeatherController';
import { OpenMeteoService } from './services/OpenMeteoService';
import { RedisCacheService } from './services/RedisCacheService';
import { MemoryCacheService } from './services/MemoryCacheService';
import { ICacheService } from './interfaces';

// Выбор способа кэширования
let cacheService: ICacheService;

// Если хотим строго Redis, запускаем как: USE_REDIS=true npm start
if (process.env.USE_REDIS === 'true') {
    console.log('Using REDIS cache');
    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    cacheService = new RedisCacheService(REDIS_URL);
} else {
    console.log('Using IN-MEMORY cache (No Redis required)');
    cacheService = new MemoryCacheService();
}

// Инициализация зависимостей
const weatherService = new OpenMeteoService();
const weatherController = new WeatherController(weatherService, cacheService);

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/weather', weatherController.getWeather);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});