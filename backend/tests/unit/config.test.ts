import { loadAuthConfig } from '../../src/config';

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
