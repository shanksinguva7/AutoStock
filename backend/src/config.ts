export interface AuthConfig {
  jwtSecret: string;
  /** Any value jsonwebtoken accepts, e.g. "1h" or "30m". */
  jwtExpiresIn: string;
}

/**
 * Reads JWT settings from the environment.
 * Fails fast instead of falling back to a default, so tokens are never signed with a known secret.
 */
export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  return {
    jwtSecret: requireEnv(env, 'JWT_SECRET'),
    jwtExpiresIn: requireEnv(env, 'JWT_EXPIRES_IN'),
  };
}

function requireEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}
