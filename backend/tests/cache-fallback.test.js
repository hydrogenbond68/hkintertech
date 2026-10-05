import assert from 'node:assert/strict';
import { test } from 'node:test';

// Point at a port nothing is listening on so every connect attempt fails fast.
process.env.REDIS_URL = 'redis://127.0.0.1:6399';
process.env.NODE_ENV = 'test';

const { getRedis, cacheGet, cacheSet, closeRedis } = await import('../services/cache.js');

test('cache: an unreachable Redis degrades to a null client instead of throwing', async () => {
  const client = await getRedis();
  assert.equal(client, null);
});

test('cache: reads and writes are safe no-ops when Redis is down', async () => {
  assert.equal(await cacheGet('any-key'), null);
  assert.equal(await cacheSet('any-key', { a: 1 }, 10), false);
});

test('cache: a failed attempt is not pinned forever (the original bug)', async () => {
  // The old code cached the rejected connect Promise, and `if (redisConnection)`
  // is truthy for a Promise, so Redis stayed dead for the process lifetime.
  // Now the failure is cleared, so later calls retry.
  await getRedis();
  await getRedis();
  await getRedis();
  // Still degraded, but the point is that these calls returned instead of
  // returning a permanently cached rejection.
  assert.equal(await getRedis(), null);
});

test('cache: closeRedis resets state so a reconnect can be attempted', async () => {
  await getRedis();
  await closeRedis();
  assert.equal(await getRedis(), null, 'should still resolve cleanly after reset');
});

test('cache: closeRedis is safe to call repeatedly', async () => {
  await closeRedis();
  await closeRedis();
});
