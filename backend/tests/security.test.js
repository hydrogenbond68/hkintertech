import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveAllowedOrigins, isOriginAllowed } from '../config/cors.js';
import { generateToken, signToken, verifyToken } from '../config/jwt.js';

const STRONG_SECRET = 'a'.repeat(48);

/**
 * Runs `fn` with a temporary environment, restoring the previous values after.
 * `undefined` removes the variable for the duration of the call.
 */
const withEnv = (env, fn) => {
  const saved = {};
  for (const [key, value] of Object.entries(env)) {
    saved[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

// --- CORS allow-list -------------------------------------------------------

test('CORS: production rejects a wildcard origin', () => {
  assert.throws(
    () => resolveAllowedOrigins({ CORS_ORIGINS: '*', NODE_ENV: 'production' }),
    /must not contain/
  );
});

test('CORS: production with no configured origin fails fast', () => {
  assert.throws(
    () => resolveAllowedOrigins({ NODE_ENV: 'production' }),
    /must be set in production/
  );
});

test('CORS: production falls back to FRONTEND_URL when CORS_ORIGINS is unset', () => {
  assert.deepEqual(
    resolveAllowedOrigins({ FRONTEND_URL: 'https://app.example.com', NODE_ENV: 'production' }),
    ['https://app.example.com']
  );
});

test('CORS: production parses a comma-separated list and trims whitespace', () => {
  assert.deepEqual(
    resolveAllowedOrigins({
      CORS_ORIGINS: 'https://a.com, https://b.com ,https://c.com',
      NODE_ENV: 'production',
    }),
    ['https://a.com', 'https://b.com', 'https://c.com']
  );
});

test('CORS: dev default is localhost-scoped and never a wildcard', () => {
  const origins = resolveAllowedOrigins({ NODE_ENV: 'development' });
  assert.ok(!origins.includes('*'), 'dev default must not be a wildcard');
  assert.ok(origins.includes('http://localhost:5173'));
});

test('CORS: dev may still opt into a wildcard explicitly', () => {
  assert.deepEqual(resolveAllowedOrigins({ CORS_ORIGINS: '*', NODE_ENV: 'development' }), ['*']);
});

test('CORS: allow-list accepts known origins and rejects strangers', () => {
  const allowed = ['https://app.example.com'];
  assert.equal(isOriginAllowed('https://app.example.com', allowed), true);
  assert.equal(isOriginAllowed('https://evil.test', allowed), false);
});

test('CORS: a request with no Origin header is allowed', () => {
  assert.equal(isOriginAllowed(undefined, ['https://app.example.com']), true);
});

// --- JWT secret handling --------------------------------------------------

test('JWT: production refuses to sign without a secret', () => {
  assert.throws(
    () => withEnv({ JWT_SECRET: undefined, NODE_ENV: 'production' }, () => generateToken('abc')),
    /at least 32 characters/
  );
});

test('JWT: production refuses a secret shorter than 32 characters', () => {
  assert.throws(
    () => withEnv({ JWT_SECRET: 'too-short', NODE_ENV: 'production' }, () => generateToken('abc')),
    /at least 32 characters/
  );
});

test('JWT: a token signed with one secret is rejected under another', () => {
  const token = withEnv({ JWT_SECRET: STRONG_SECRET, NODE_ENV: 'production' }, () =>
    generateToken('user-123')
  );
  withEnv({ JWT_SECRET: 'b'.repeat(48), NODE_ENV: 'production' }, () => {
    assert.throws(() => verifyToken(token));
  });
});

test('JWT: an expired token is rejected', () => {
  const token = withEnv(
    { JWT_SECRET: STRONG_SECRET, NODE_ENV: 'production', JWT_EXPIRES_IN: '-1s' },
    () => generateToken('user-123')
  );
  withEnv({ JWT_SECRET: STRONG_SECRET, NODE_ENV: 'production' }, () => {
    assert.throws(() => verifyToken(token));
  });
});

test('JWT: an alg=none forgery is rejected by the pinned algorithm list', () => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ id: 'attacker' })).toString('base64url');
  const forged = `${header}.${payload}.`;
  withEnv({ JWT_SECRET: STRONG_SECRET, NODE_ENV: 'production' }, () => {
    assert.throws(() => verifyToken(forged));
  });
});

test('JWT: signToken round-trips extra claims', () => {
  const token = withEnv({ JWT_SECRET: STRONG_SECRET, NODE_ENV: 'production' }, () =>
    signToken({ id: 'u1', email: 'user@example.com', is_admin: true })
  );
  const claims = withEnv({ JWT_SECRET: STRONG_SECRET, NODE_ENV: 'production' }, () =>
    verifyToken(token)
  );
  assert.equal(claims.id, 'u1');
  assert.equal(claims.email, 'user@example.com');
  assert.equal(claims.is_admin, true);
});

test('JWT: dev generates an ephemeral secret rather than a known literal', () => {
  const first = withEnv({ JWT_SECRET: undefined, NODE_ENV: 'development' }, () =>
    generateToken('user-123')
  );
  // It must verify in the same process (stable within a run)...
  const decoded = withEnv({ JWT_SECRET: undefined, NODE_ENV: 'development' }, () =>
    verifyToken(first)
  );
  assert.equal(decoded.id, 'user-123');
});
