const splitOrigins = (raw) =>
  String(raw || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

/**
 * Resolves the allowed CORS origins from configuration.
 *
 * Wildcards are rejected in production: pairing a reflected Origin with
 * `Access-Control-Allow-Credentials: true` lets any website issue
 * credentialed cross-site requests against this API.
 */
export const resolveAllowedOrigins = (env = process.env) => {
  const configured = splitOrigins(env.CORS_ORIGINS || env.FRONTEND_URL);
  const allowsWildcard = !configured.includes('*');

  if (configured.length === 0) {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'CORS_ORIGINS (or FRONTEND_URL) must be set in production. Refusing to start with no allowed origins.'
      );
    }
    // Development only: allow the local dev servers used by this project.
    return [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost',
      'http://127.0.0.1',
    ];
  }

  if (!allowsWildcard) {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'CORS_ORIGINS must not contain "*" in production; list the allowed origins explicitly.'
      );
    }
    return ['*'];
  }

  return configured;
};

export const isOriginAllowed = (origin, allowedOrigins) => {
  if (!origin) return true;
  if (allowedOrigins.includes('*')) return true;
  return allowedOrigins.includes(origin);
};

/**
 * Builds the origin callback shared by the HTTP and Socket.IO servers so both
 * enforce an identical policy. A rejection is a 403, which keeps it out of the
 * 5xx error log and avoids logging noise from scanners.
 */
export const createOriginChecker = (allowedOrigins) => (origin, callback) => {
  if (isOriginAllowed(origin, allowedOrigins)) return callback(null, true);
  const error = new Error('CORS origin is not allowed');
  error.statusCode = 403;
  return callback(error);
};

export default resolveAllowedOrigins;
