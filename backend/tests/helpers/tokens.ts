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
