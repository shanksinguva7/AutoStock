import { RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthConfig } from '../config';
import { Role } from '../repositories/userRepository';
import { ForbiddenError, UnauthorizedError } from '../errors';

const BEARER_PREFIX = 'Bearer ';
// Pinned so a token cannot pick its own algorithm (e.g. "none" or a different HMAC).
const ALLOWED_ALGORITHMS: jwt.Algorithm[] = ['HS256'];
const ROLES: readonly Role[] = ['user', 'admin'];
const INVALID_TOKEN = 'Invalid or expired token';

export interface AuthUser {
  id: number;
  role: Role;
}

/** Builds middleware that rejects requests without a valid Bearer JWT (401). */
export function createRequireAuth(config: AuthConfig): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }
    res.locals.auth = verifyToken(header.slice(BEARER_PREFIX.length), config.jwtSecret);
    next();
  };
}

/** Allows only admins through. Must run after requireAuth. */
export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (getAuthUser(res).role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  next();
};

/** Returns the user requireAuth attached to this response. */
export function getAuthUser(res: Response): AuthUser {
  const auth = res.locals.auth as AuthUser | undefined;
  if (!auth) {
    throw new UnauthorizedError('Authentication required');
  }
  return auth;
}

function verifyToken(token: string, secret: string): AuthUser {
  const payload = verifySignature(token, secret);
  const id = Number(payload.sub);
  // A correctly signed token can still carry a bad payload, so check its shape too.
  if (!Number.isInteger(id) || !ROLES.includes(payload.role)) {
    throw new UnauthorizedError(INVALID_TOKEN);
  }
  return { id, role: payload.role };
}

function verifySignature(token: string, secret: string): jwt.JwtPayload {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ALLOWED_ALGORITHMS });
    if (typeof payload === 'object') {
      return payload;
    }
  } catch {
    // Fall through: bad signature, expiry and malformed tokens all get the same 401.
  }
  throw new UnauthorizedError(INVALID_TOKEN);
}
