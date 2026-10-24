import { RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthConfig } from '../config';
import { Role } from '../repositories/userRepository';
import { ForbiddenError, UnauthorizedError } from '../errors';

const BEARER_PREFIX = 'Bearer ';
// Pinned so a token cannot pick its own algorithm (e.g. "none" or a different HMAC).
const ALLOWED_ALGORITHMS: jwt.Algorithm[] = ['HS256'];
const ROLES: readonly Role[] = ['user', 'admin'];

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
  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ALLOWED_ALGORITHMS });
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
  const id = typeof payload === 'object' ? Number(payload.sub) : NaN;
  const role = typeof payload === 'object' ? payload.role : undefined;
  if (!Number.isInteger(id) || !ROLES.includes(role)) {
    throw new UnauthorizedError('Invalid or expired token');
  }
  return { id, role };
}
