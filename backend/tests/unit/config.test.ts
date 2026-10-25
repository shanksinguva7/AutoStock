import { loadAdminCredentials, loadAuthConfig, loadCorsOrigins } from '../../src/config';

describe('loadAuthConfig', () => {
  it('reads the JWT secret and expiry from the environment', () => {
    const config = loadAuthConfig({ JWT_SECRET: 'from-env', JWT_EXPIRES_IN: '2h' });

    expect(config).toEqual({ jwtSecret: 'from-env', jwtExpiresIn: '2h' });
  });

  it('throws when JWT_SECRET is missing so the app never signs with a default secret', () => {
    expect(() => loadAuthConfig({ JWT_EXPIRES_IN: '1h' })).toThrow(/JWT_SECRET/);
  });

  it('throws when JWT_EXPIRES_IN is missing', () => {
    expect(() => loadAuthConfig({ JWT_SECRET: 'from-env' })).toThrow(/JWT_EXPIRES_IN/);
  });
});

describe('loadAdminCredentials', () => {
  it('reads the seed admin email and password from the environment', () => {
    const credentials = loadAdminCredentials({ ADMIN_EMAIL: 'a@b.test', ADMIN_PASSWORD: 'pw-123456' });

    expect(credentials).toEqual({ email: 'a@b.test', password: 'pw-123456' });
  });

  it('throws when ADMIN_EMAIL or ADMIN_PASSWORD is missing', () => {
    expect(() => loadAdminCredentials({ ADMIN_EMAIL: 'a@b.test' })).toThrow(/ADMIN_PASSWORD/);
    expect(() => loadAdminCredentials({ ADMIN_PASSWORD: 'pw-123456' })).toThrow(/ADMIN_EMAIL/);
  });
});

describe('loadCorsOrigins', () => {
  it('reads a comma-separated list of origins and trims spaces', () => {
    const origins = loadCorsOrigins({ CORS_ORIGIN: 'https://a.test, https://b.test ,' });

    expect(origins).toEqual(['https://a.test', 'https://b.test']);
  });

  it('returns no origins when CORS_ORIGIN is not set, so cross-origin calls stay blocked', () => {
    expect(loadCorsOrigins({})).toEqual([]);
  });
});
