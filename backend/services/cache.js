import { createClient } from 'redis';
import crypto from 'crypto';

let redisClient;
let redisConnection;
let retryAfter = 0;
let warnedUnavailable = false;

const getRedisUrl = () => process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const RETRY_COOLDOWN_MS = 5000;
const CONNECT_BUDGET_MS = 3000;
const MAX_CONNECT_ATTEMPTS = 3;

/**
 * Bounds an operation that must never outlive the caller's request.
 * Without this, an unreachable Redis leaves connect() pending forever and every
 * cached read hangs instead of degrading.
 */
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      timer.unref?.();
    }),
  ]);

const connectRedis = async () => {
  if (redisClient?.isOpen) return redisClient;
  // An in-flight attempt is a pending Promise, so this also collapses
  // concurrent callers onto a single connect().
  if (redisConnection) return redisConnection;

  if (Date.now() < retryAfter) return null;

  // A previous client may still be sitting in a failed/closing state.
  if (redisClient) {
    redisClient.removeAllListeners();
    redisClient.disconnect().catch(() => {});
    redisClient = undefined;
  }

  const client = createClient({
    url: getRedisUrl(),
    socket: {
      // Stop after a few attempts instead of retrying indefinitely: a bounded
      // strategy lets connect() settle so the caller can degrade gracefully.
      reconnectStrategy: (retries) => {
        if (retries >= MAX_CONNECT_ATTEMPTS) {
          return new Error('Redis reconnect budget exhausted');
        }
        return Math.min(retries * 100, 1000);
      },
      connectTimeout: 2000,
    },
  });

  client.on('error', (error) => {
    console.error('Redis error:', error.message);
  });

  client.on('ready', () => {
    warnedUnavailable = false;
  });

  redisConnection = withTimeout(client.connect(), CONNECT_BUDGET_MS, 'Redis connect')
    .then(() => client)
    .catch((error) => {
      console.error('Redis unavailable; continuing with database fallback:', error.message);
      if (!warnedUnavailable) {
        console.warn('[cache] Redis is not reachable. Catalog caching, cross-instance rate limiting, ' +
          'and the Socket.IO multi-instance adapter are inactive until a connection succeeds.');
        warnedUnavailable = true;
      }
      client.removeAllListeners();
      client.disconnect().catch(() => {});
      // Drop the cached attempt so a later call can retry instead of pinning
      // the failure for the lifetime of the process.
      redisConnection = undefined;
      redisClient = undefined;
      retryAfter = Date.now() + RETRY_COOLDOWN_MS;
      return null;
    });

  return redisConnection;
};

const serialize = (value) => JSON.stringify(value);

const deserialize = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getRedis = async () => {
  await connectRedis();
  return redisClient?.isOpen ? redisClient : null;
};

export const cacheGet = async (key) => {
  const client = await getRedis();
  if (!client) return null;
  try {
    return deserialize(await client.get(key));
  } catch {
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 10) => {
  const client = await getRedis();
  if (!client) return false;
  try {
    await client.set(key, serialize(value), { EX: ttlSeconds });
    return true;
  } catch {
    return false;
  }
};

export const cacheDelete = async (key) => {
  const client = await getRedis();
  if (!client) return false;
  try {
    await client.del(key);
    return true;
  } catch {
    return false;
  }
};

export const getCatalogVersion = async () => {
  const client = await getRedis();
  if (!client) return 'local';
  try {
    return (await client.get('catalog:version')) || '0';
  } catch {
    return 'local';
  }
};

export const invalidateCatalog = async () => {
  const client = await getRedis();
  if (!client) return false;
  try {
    await client.incr('catalog:version');
    return true;
  } catch {
    return false;
  }
};

export const withCatalogCache = async (queryKey, loader, options = {}) => {
  const ttl = options.ttl ?? Number(process.env.CATALOG_CACHE_TTL || 10);
  const staleTtl = options.staleTtl ?? Number(process.env.CATALOG_STALE_TTL || 30);
  const version = await getCatalogVersion();
  const key = `catalog:v${version}:${crypto.createHash('sha1').update(queryKey).digest('hex')}`;
  const cached = await cacheGet(key);
  const now = Date.now();

  if (cached?.value && now <= cached.staleUntil) {
    if (now > cached.refreshAfter) {
      const lockKey = `${key}:revalidate`;
      const client = await getRedis();
      if (client) {
        const acquired = await client.set(lockKey, '1', { NX: true, EX: Math.max(5, staleTtl) });
        if (acquired) {
          loader().then((value) => cacheSet(key, {
            value,
            createdAt: Date.now(),
            refreshAfter: Date.now() + Math.max(1000, ttl * 700),
            staleUntil: Date.now() + staleTtl * 1000,
          }, ttl + staleTtl)).catch((error) => {
            console.error('Background catalog revalidation failed:', error.message);
          });
        }
      }
    }
    return { value: cached.value, cache: 'STALE' };
  }

  const value = await loader();
  await cacheSet(key, {
    value,
    createdAt: Date.now(),
    refreshAfter: Date.now() + Math.max(1000, ttl * 700),
    staleUntil: Date.now() + staleTtl * 1000,
  }, ttl + staleTtl);
  return { value, cache: 'MISS' };
};

export const closeRedis = async () => {
  if (redisClient?.isOpen) {
    await redisClient.quit().catch(() => redisClient.disconnect());
  }
  if (redisClient) {
    redisClient.removeAllListeners();
    redisClient.disconnect().catch(() => {});
  }
  redisClient = undefined;
  redisConnection = undefined;
  retryAfter = 0;
};

export default connectRedis;
