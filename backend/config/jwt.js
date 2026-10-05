import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ALGORITHM = 'HS256';
const MIN_SECRET_LENGTH = 32;

let ephemeralSecret = null;

/**
 * Resolves the JWT signing secret.
 *
 * In production a missing or weak secret is fatal: booting with a random or
 * well-known secret would invalidate every session on restart and would let
 * anyone holding the literal fallback mint valid tokens.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.length >= MIN_SECRET_LENGTH) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `JWT_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters in production.`
    );
  }

  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(48).toString('hex');
    console.warn(
      '[auth] JWT_SECRET is unset or too short; generated an ephemeral development secret. ' +
      'All tokens will be invalidated on restart and will not work across instances.'
    );
  }
  return ephemeralSecret;
};

export const signToken = (payload) =>
  jwt.sign(payload, getJwtSecret(), {
    algorithm: ALGORITHM,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const generateToken = (id) => signToken({ id });

export const verifyToken = (token) =>
  jwt.verify(token, getJwtSecret(), { algorithms: [ALGORITHM] });

export default generateToken;
