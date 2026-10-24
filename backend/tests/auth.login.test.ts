import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';

describe('POST /api/auth/login', () => {
  const db = new PrismaClient();
  const app = createApp(db);
  const credentials = { email: 'buyer@example.com', password: 'secret123' };

  beforeEach(async () => {
    await db.user.deleteMany();
    await request(app).post('/api/auth/register').send(credentials);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('returns 200 with a JWT and the public user for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({ id: expect.any(Number), email: credentials.email, role: 'user' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('signs the token with JWT_SECRET and puts the user id and role in it', async () => {
    const res = await request(app).post('/api/auth/login').send(credentials);

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    expect(payload.sub).toBe(String(res.body.user.id));
    expect(payload.role).toBe('user');
    expect(payload.exp).toEqual(expect.any(Number));
  });

  it('accepts the email in any letter case', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, email: 'BUYER@Example.com' });

    expect(res.status).toBe(200);
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('token');
  });

  it('returns 401 for an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: credentials.password });

    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('token');
  });

  it('gives the same error for unknown email and wrong password so emails cannot be probed', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: credentials.password });

    expect(unknownEmail.body).toEqual(wrongPassword.body);
    expect(wrongPassword.body).toEqual({ error: 'Invalid email or password' });
  });

  it('returns 400 when email or password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: credentials.email });

    expect(res.status).toBe(400);
  });
});
