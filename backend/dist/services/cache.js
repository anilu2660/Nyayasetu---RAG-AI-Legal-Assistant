"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCache = initCache;
exports.getCache = getCache;
exports.setCache = setCache;
exports.delCache = delCache;
exports.incrCache = incrCache;
const ioredis_1 = __importDefault(require("ioredis"));
let redisClient = null;
let useLocalCache = true;
const localCache = new Map();
const localCounter = new Map();
function initCache() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        try {
            redisClient = new ioredis_1.default(redisUrl, {
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
        }
        catch (err) {
            console.warn('Could not initialize Redis, using local memory cache:', err);
            useLocalCache = true;
        }
    }
    else {
        useLocalCache = true;
        console.log('Using local in-memory cache (Redis URL not provided).');
    }
}
// Ensure initCache is called once
initCache();
async function getCache(key) {
    if (!useLocalCache && redisClient) {
        try {
            return await redisClient.get(key);
        }
        catch (err) {
            console.warn('Redis get failed, using local fallback:', err);
        }
    }
    // Local Fallback
    const entry = localCache.get(key);
    if (!entry)
        return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
        localCache.delete(key);
        return null;
    }
    return entry.value;
}
async function setCache(key, value, ttlSeconds) {
    if (!useLocalCache && redisClient) {
        try {
            if (ttlSeconds) {
                await redisClient.set(key, value, 'EX', ttlSeconds);
            }
            else {
                await redisClient.set(key, value);
            }
            return;
        }
        catch (err) {
            console.warn('Redis set failed, using local fallback:', err);
        }
    }
    // Local Fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    localCache.set(key, { value, expiresAt });
}
async function delCache(key) {
    if (!useLocalCache && redisClient) {
        try {
            await redisClient.del(key);
            return;
        }
        catch (err) {
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
async function incrCache(key, windowSeconds = 60) {
    if (!useLocalCache && redisClient) {
        try {
            const pipeline = redisClient.multi();
            pipeline.incr(key);
            pipeline.ttl(key);
            const results = await pipeline.exec();
            if (results && results[0] && results[1]) {
                const count = results[0][1];
                const ttl = results[1][1];
                if (ttl === -1) {
                    await redisClient.expire(key, windowSeconds);
                }
                return count;
            }
        }
        catch (err) {
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
