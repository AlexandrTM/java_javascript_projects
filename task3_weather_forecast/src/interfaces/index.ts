export interface IGeoData {
    name: string;
    latitude: number;
    longitude: number;
}

export interface IWeatherData {
    time: string[];
    temperature: number[];
}

export interface IWeatherService {
    getWeather(city: string): Promise<IWeatherData>;
}

export interface ICacheService {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds: number): Promise<void>;
}