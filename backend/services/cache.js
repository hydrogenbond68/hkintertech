import { createClient } from 'redis';
import crypto from 'crypto';

let redisClient;
let redisConnection;

const getRedisUrl = () => process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const connectRedis = async () => {
  if (redisClient?.isOpen) return redisClient;
  if (redisConnection) return redisConnection;

  redisClient = createClient({
    url: getRedisUrl(),
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      connectTimeout: 5000,
    },
  });

  redisClient.on('error', (error) => {
    console.error('Redis error:', error.message);
  });

  redisConnection = redisClient.connect().catch((error) => {
    console.error('Redis unavailable; continuing with database fallback:', error.message);
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
  redisClient = null;
  redisConnection = null;
};

export default connectRedis;
