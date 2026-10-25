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

export interface AdminCredentials {
  email: string;
  password: string;
}

/** Reads the demo admin account the seed script creates. */
export function loadAdminCredentials(env: NodeJS.ProcessEnv = process.env): AdminCredentials {
  return {
    email: requireEnv(env, 'ADMIN_EMAIL'),
    password: requireEnv(env, 'ADMIN_PASSWORD'),
  };
}

function requireEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

/**
 * Reads the browser origins allowed to call the API from CORS_ORIGIN (comma-separated).
 * Unset means none: local dev goes through the Vite proxy, which needs no CORS.
 */
export function loadCorsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
