import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';

const FRONTEND_ORIGIN = 'https://autostock.example.test';
const OTHER_ORIGIN = 'https://evil.example.test';

describe('CORS', () => {
  const db = new PrismaClient();
  const originalCorsOrigin = process.env.CORS_ORIGIN;

  afterEach(() => {
    if (originalCorsOrigin === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = originalCorsOrigin;
    }
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('allows requests from the origin in CORS_ORIGIN', async () => {
    process.env.CORS_ORIGIN = FRONTEND_ORIGIN;

    const res = await request(createApp(db)).get('/health').set('Origin', FRONTEND_ORIGIN);

    expect(res.headers['access-control-allow-origin']).toBe(FRONTEND_ORIGIN);
  });

  it('answers a preflight for an authorized JSON request from the allowed origin', async () => {
    process.env.CORS_ORIGIN = FRONTEND_ORIGIN;

    const res = await request(createApp(db))
      .options('/api/vehicles')
      .set('Origin', FRONTEND_ORIGIN)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(FRONTEND_ORIGIN);
    expect(res.headers['access-control-allow-headers']).toMatch(/authorization/i);
  });

  it('allows each origin in a comma-separated CORS_ORIGIN', async () => {
    const previewOrigin = 'https://autostock-preview.example.test';
    process.env.CORS_ORIGIN = `${FRONTEND_ORIGIN}, ${previewOrigin}`;

    const res = await request(createApp(db)).get('/health').set('Origin', previewOrigin);

    expect(res.headers['access-control-allow-origin']).toBe(previewOrigin);
  });

  it('does not allow an origin that is not in CORS_ORIGIN', async () => {
    process.env.CORS_ORIGIN = FRONTEND_ORIGIN;

    const res = await request(createApp(db)).get('/health').set('Origin', OTHER_ORIGIN);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('sends no CORS headers when CORS_ORIGIN is not set', async () => {
    delete process.env.CORS_ORIGIN;

    const res = await request(createApp(db)).get('/health').set('Origin', FRONTEND_ORIGIN);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
