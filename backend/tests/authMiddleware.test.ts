import express, { Express } from 'express';
import request from 'supertest';
import { createRequireAuth, getAuthUser, requireAdmin } from '../src/middleware/auth';
import { errorHandler } from '../src/middleware/errorHandler';
import { loadAuthConfig } from '../src/config';
import { signTestToken as signToken } from './helpers/tokens';

const config = loadAuthConfig();

/** Test-only app: one route behind requireAuth, one behind requireAuth + requireAdmin. */
function buildGuardedApp(): Express {
  const app = express();
  const requireAuth = createRequireAuth(config);
  app.get('/protected', requireAuth, (_req, res) => {
    res.json(getAuthUser(res));
  });
  app.get('/admin-only', requireAuth, requireAdmin, (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

const userToken = () => signToken({ role: 'user' }, { subject: '7' });
const adminToken = () => signToken({ role: 'admin' }, { subject: '1' });

describe('requireAuth middleware', () => {
  const app = buildGuardedApp();

  it('lets a valid token through and exposes the user id and role', async () => {
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${userToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 7, role: 'user' });
  });

  it('returns 401 when the Authorization header is missing', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 when the header has no "Bearer " prefix', async () => {
    const res = await request(app).get('/protected').set('Authorization', userToken());

    expect(res.status).toBe(401);
  });

  it('returns 401 for a malformed token', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer not.a.jwt');

    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const forged = signToken({ role: 'admin' }, { subject: '1' }, 'some-other-secret');

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const ONE_MINUTE_AGO = -60;
    const expired = signToken({ role: 'user' }, { subject: '7', expiresIn: ONE_MINUTE_AGO });

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with an algorithm other than HS256', async () => {
    const hs512 = signToken({ role: 'user' }, { subject: '7', algorithm: 'HS512' });

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${hs512}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 for a validly signed token that has no user id', async () => {
    const noSubject = signToken({ role: 'user' });

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${noSubject}`);

    expect(res.status).toBe(401);
  });
});

describe('requireAdmin middleware', () => {
  const app = buildGuardedApp();

  it('returns 403 for a valid user token on an admin-only route', async () => {
    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${userToken()}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('lets a valid admin token through', async () => {
    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 401, not 403, when no token is sent to an admin-only route', async () => {
    const res = await request(app).get('/admin-only');

    expect(res.status).toBe(401);
  });
});
