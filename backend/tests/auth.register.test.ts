import request from 'supertest';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';

describe('POST /api/auth/register', () => {
  const db = new PrismaClient();
  const app = createApp(db);
  const validUser = { email: 'buyer@example.com', password: 'secret123' };

  beforeEach(async () => {
    await db.user.deleteMany();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('returns 201 with the new user and never exposes the password hash', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), email: validUser.email, role: 'user' });
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('password');
  });

  it('stores the password as a bcrypt hash, not plain text', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const stored = await db.user.findUniqueOrThrow({ where: { email: validUser.email } });
    expect(stored.passwordHash).not.toBe(validUser.password);
    await expect(bcrypt.compare(validUser.password, stored.passwordHash)).resolves.toBe(true);
  });

  it('gives new users the default role "user"', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const stored = await db.user.findUniqueOrThrow({ where: { email: validUser.email } });
    expect(stored.role).toBe('user');
  });

  it('ignores a role sent by the client so nobody can self-register as admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('user');
  });

  it('returns 400 when the email is not a valid address', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when the password is shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when email or password is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(400);
  });

  it('returns 409 when the email is already registered', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('treats emails case-insensitively when checking for duplicates', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'BUYER@example.com' });

    expect(res.status).toBe(409);
  });
});
