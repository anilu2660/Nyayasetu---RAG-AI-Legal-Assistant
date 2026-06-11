import Redis from 'ioredis';

let redisClient: Redis | null = null;
let useLocalCache = true;

// In-Memory Fallback Cache Store
interface CacheEntry {
  value: string;
  expiresAt: number | null;
}
const localCache = new Map<string, CacheEntry>();
const localCounter = new Map<string, { count: number; expiresAt: number }>();

export function initCache() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        lazyConnect: true
      });
      redisClient.on('error', (err) => {
        console.warn('Redis client error, falling back to local memory cache:', err.message);
        useLocalCache = true;
      });
      redisClient.connect()
        .then(() => {
          useLocalCache = false;
          console.log('Connected to Redis cache.');
        })
        .catch((err) => {
          console.warn('Redis connection failed, falling back to local memory cache:', err.message);
          useLocalCache = true;
        });
    } catch (err) {
      console.warn('Could not initialize Redis, using local memory cache:', err);
      useLocalCache = true;
    }
  } else {
    useLocalCache = true;
    console.log('Using local in-memory cache (Redis URL not provided).');
  }
}

// Ensure initCache is called once
initCache();

export async function getCache(key: string): Promise<string | null> {
  if (!useLocalCache && redisClient) {
    try {
      return await redisClient.get(key);
    } catch (err) {
      console.warn('Redis get failed, using local fallback:', err);
    }
  }
  
  // Local Fallback
  const entry = localCache.get(key);
  if (!entry) return null;
  
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    localCache.delete(key);
    return null;
  }
  
  return entry.value;
}

export async function setCache(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (!useLocalCache && redisClient) {
    try {
      if (ttlSeconds) {
        await redisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, value);
      }
      return;
    } catch (err) {
      console.warn('Redis set failed, using local fallback:', err);
    }
  }
  
  // Local Fallback
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  localCache.set(key, { value, expiresAt });
}

export async function delCache(key: string): Promise<void> {
  if (!useLocalCache && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (err) {
      console.warn('Redis delete failed, using local fallback:', err);
    }
  }
  
  // Local Fallback
  localCache.delete(key);
  localCounter.delete(key);
}

/**
 * Increment a key for rate limiting.
 * Returns the incremented value.
 */
export async function incrCache(key: string, windowSeconds = 60): Promise<number> {
  if (!useLocalCache && redisClient) {
    try {
      const pipeline = redisClient.multi();
      pipeline.incr(key);
      pipeline.ttl(key);
      const results = await pipeline.exec();
      if (results && results[0] && results[1]) {
        const count = results[0][1] as number;
        const ttl = results[1][1] as number;
        if (ttl === -1) {
          await redisClient.expire(key, windowSeconds);
        }
        return count;
      }
    } catch (err) {
      console.warn('Redis incr failed, using local fallback:', err);
    }
  }
  
  // Local Fallback
  const now = Date.now();
  const counter = localCounter.get(key);
  
  if (!counter || now > counter.expiresAt) {
    const expiresAt = now + windowSeconds * 1000;
    localCounter.set(key, { count: 1, expiresAt });
    return 1;
  }
  
  counter.count += 1;
  return counter.count;
}
