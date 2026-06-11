export declare function initCache(): void;
export declare function getCache(key: string): Promise<string | null>;
export declare function setCache(key: string, value: string, ttlSeconds?: number): Promise<void>;
export declare function delCache(key: string): Promise<void>;
/**
 * Increment a key for rate limiting.
 * Returns the incremented value.
 */
export declare function incrCache(key: string, windowSeconds?: number): Promise<number>;
