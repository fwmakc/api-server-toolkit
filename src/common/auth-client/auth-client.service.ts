import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { httpGet } from '../helper/http.helper';
import { AccountInfo } from './auth-client.interfaces';

@Injectable()
export class AuthClientService {
  private readonly logger = new Logger(AuthClientService.name);
  private readonly baseUrl: string;
  private readonly internalKey: string;
  private cache = new Map<number, { data: AccountInfo; expires: number }>();
  private readonly defaultTtl: number;
  private readonly maxEntries: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get('AUTH_SERVER_URL') || 'http://localhost:3001';
    this.internalKey = this.configService.get('INTERNAL_API_KEY') || '';
    const ttlEnv = process.env.AUTH_CACHE_TTL;
    this.defaultTtl = ttlEnv !== undefined ? Number(ttlEnv) : 30_000;
    const maxEnv = process.env.AUTH_CACHE_MAX;
    this.maxEntries = Number(maxEnv) > 0 ? Number(maxEnv) : 10_000;
    if (!this.internalKey) {
      this.logger.warn(
        'INTERNAL_API_KEY is not set — auth-server requests will fail',
      );
    }
  }

  async getAccountInfo(id: number): Promise<AccountInfo | null> {
    const cached = this.cache.get(id);
    if (cached) {
      // Переустановка перемещает id в конец Map (порядок = давность
      // использования, LRU), просроченная запись просто выбрасывается
      this.cache.delete(id);
      if (cached.expires > Date.now()) {
        this.cache.set(id, cached);
        return cached.data;
      }
    }

    try {
      const response = await httpGet(
        `${this.baseUrl}/account/internal/info/${id}`,
        {
          headers: { 'X-Internal-Api-Key': this.internalKey },
          timeout: 5000,
          raw: true,
        },
      );

      const cacheControl = response.headers?.['cache-control'];
      const maxAge = cacheControl?.match(/max-age=(\d+)/)?.[1];
      const ttl = maxAge ? Number(maxAge) * 1000 : this.defaultTtl;

      this.cache.set(id, {
        data: response.data as AccountInfo,
        expires: Date.now() + ttl,
      });
      this.evictStale();
      return response.data as AccountInfo;
    } catch (e) {
      this.logger.error(
        `Failed to fetch account ${id}: ${(e as Error).message}`,
      );
      return null;
    }
  }

  clearCache(id?: number) {
    if (id) {
      this.cache.delete(id);
    } else {
      this.cache.clear();
    }
  }

  private evictStale() {
    while (this.cache.size > this.maxEntries) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      this.cache.delete(oldest);
    }
  }
}
