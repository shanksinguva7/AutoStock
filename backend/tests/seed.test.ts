import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';
import { seed } from '../src/scripts/seed';

describe('seed script', () => {
  const db = new PrismaClient();
  const env = {
    ...process.env,
    ADMIN_EMAIL: 'admin@autostock.test',
    ADMIN_PASSWORD: 'admin-pass-123',
  };

  beforeEach(async () => {
    await db.user.deleteMany();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('creates one admin user with a hashed password', async () => {
    await seed(db, env);

    const admins = await db.user.findMany({ where: { email: env.ADMIN_EMAIL } });
    expect(admins).toHaveLength(1);
    expect(admins[0].role).toBe('admin');
    await expect(bcrypt.compare(env.ADMIN_PASSWORD, admins[0].passwordHash)).resolves.toBe(true);
  });

  it('is idempotent: running it twice does not crash or duplicate the admin', async () => {
    await seed(db, env);
    await expect(seed(db, env)).resolves.not.toThrow();

    await expect(db.user.count({ where: { email: env.ADMIN_EMAIL } })).resolves.toBe(1);
  });

  it('lets the seeded admin log in and receive an admin token', async () => {
    await seed(db, env);

    const res = await request(createApp(db))
      .post('/api/auth/login')
      .send({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    expect(payload.role).toBe('admin');
  });
});
