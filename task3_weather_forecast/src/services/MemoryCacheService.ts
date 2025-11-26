import { ICacheService } from '../interfaces';

type CacheEntry = {
    value: any;
    expiry: number;
};

export class MemoryCacheService implements ICacheService {
    private cache: Map<string, CacheEntry> = new Map();

    async get<T>(key: string): Promise<T | null> {
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Проверяем, не истёк ли срок жизни
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.value as T;
    }

    async set(key: string, value: any, ttlSeconds: number): Promise<void> {
        const expiry = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { value, expiry });
    }
}