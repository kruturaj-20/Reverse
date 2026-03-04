/**
 * Redis Cache Utility
 * ─────────────────────────────────────────────────────────────────────────────
 * Wraps ioredis with a graceful no-op fallback when REDIS_URL is not configured.
 * This lets the app function correctly in dev/test without Redis installed.
 *
 * Usage:
 *   import { cache } from '../utils/cache';
 *   await cache.set('key', JSON.stringify(data), 300);   // TTL in seconds
 *   const data = await cache.get('key');
 *   await cache.del('key');
 *
 * Key namespacing convention:
 *   products:list:{hash}     — product list queries
 *   products:id:{id}         — single product
 *   search:{hash}            — search results
 */

import Redis from 'ioredis';
import { config } from '../config';
import logger from './logger';

// ─── Cache interface ──────────────────────────────────────────────────────────

interface CacheClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    flush(): Promise<void>;
    isConnected: boolean;
}

// ─── No-op stub for when Redis is not configured ─────────────────────────────

const noopCache: CacheClient = {
    get: async (_key: string): Promise<string | null> => null,
    set: async (_key: string, _value: string, _ttlSeconds?: number): Promise<void> => { },
    del: async (_key: string): Promise<void> => { },
    flush: async (): Promise<void> => { },
    isConnected: false,
};

// ─── Real Redis Client ────────────────────────────────────────────────────────

function createRedisCache(url: string): CacheClient {
    const client = new Redis(url, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableReadyCheck: true,
        connectTimeout: 5000,
    });

    client.on('connect', () => logger.info('[cache] Redis connected'));
    client.on('error', (err: Error) => logger.error(`[cache] Redis error: ${err.message}`));
    client.on('close', () => logger.warn('[cache] Redis connection closed'));

    client.connect().catch((err: Error) => {
        logger.error(`[cache] Failed to connect to Redis: ${err.message}. Falling back to no-cache mode.`);
    });

    return {
        get: async (key: string): Promise<string | null> => {
            try {
                return await client.get(key);
            } catch (err: any) {
                logger.error(`[cache] GET failed for key "${key}": ${err.message}`);
                return null;
            }
        },

        set: async (key: string, value: string, ttlSeconds = 300): Promise<void> => {
            try {
                await client.setex(key, ttlSeconds, value);
            } catch (err: any) {
                logger.error(`[cache] SET failed for key "${key}": ${err.message}`);
            }
        },

        del: async (key: string): Promise<void> => {
            try {
                await client.del(key);
            } catch (err: any) {
                logger.error(`[cache] DEL failed for key "${key}": ${err.message}`);
            }
        },

        flush: async (): Promise<void> => {
            try {
                await client.flushdb();
            } catch (err: any) {
                logger.error(`[cache] FLUSHDB failed: ${err.message}`);
            }
        },

        isConnected: true as const,
    };
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const cache: CacheClient = config.redisUrl
    ? createRedisCache(config.redisUrl)
    : noopCache;

// ─── Cache key helpers ────────────────────────────────────────────────────────

import crypto from 'crypto';

/** Deterministic hash for query param objects → safe cache keys */
export const hashQuery = (params: Record<string, unknown>): string => {
    const sorted = JSON.stringify(params, Object.keys(params).sort());
    return crypto.createHash('md5').update(sorted).digest('hex').slice(0, 16);
};

export const CacheTTL = {
    PRODUCT_LIST: 5 * 60,        // 5 minutes
    PRODUCT_DETAIL: 10 * 60,     // 10 minutes
    SEARCH_RESULTS: 2 * 60,      // 2 minutes
} as const;
