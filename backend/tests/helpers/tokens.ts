import jwt from 'jsonwebtoken';
import { loadAuthConfig } from '../../src/config';

const { jwtSecret } = loadAuthConfig();

/** Signs an HS256 test JWT with the test secret unless another secret is given. */
export function signTestToken(
  payload: object,
  options: jwt.SignOptions = {},
  secret: string = jwtSecret,
): string {
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1h', ...options });
}

/** Signs a token for a fixed test user id with the given role. */
export function signRoleToken(role: 'user' | 'admin', secret?: string): string {
  return signTestToken({ role }, { subject: '1' }, secret);
}
