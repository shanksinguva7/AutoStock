import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';

describe('GET /health', () => {
  const db = new PrismaClient();

  afterAll(async () => {
    await db.$disconnect();
  });

  it('returns 200 and reports the database as up', async () => {
    const res = await request(createApp(db)).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('returns 503 and reports the database as down when it cannot connect', async () => {
    // SQLite cannot create a file inside a folder that does not exist.
    const unreachableDb = new PrismaClient({
      datasources: { db: { url: 'file:./missing-folder/unreachable.db' } },
    });

    const res = await request(createApp(unreachableDb)).get('/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'error', database: 'down' });
    await unreachableDb.$disconnect();
  });
});
