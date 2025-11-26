import { createClient, RedisClientType } from 'redis';
import { ICacheService } from '../interfaces';

export class RedisCacheService implements ICacheService {
    private client: RedisClientType;

    constructor(url: string) {
        this.client = createClient({ url });
        this.client.on('error', (err) => console.error('Redis Client Error', err));
        this.client.connect();
    }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, value: any, ttlSeconds: number): Promise<void> {
        await this.client.set(key, JSON.stringify(value), {
            EX: ttlSeconds
        });
    }
}