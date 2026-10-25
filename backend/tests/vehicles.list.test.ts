import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';
import { signTestToken } from './helpers/tokens';

const signToken = (role: 'user' | 'admin', secret?: string) =>
  signTestToken({ role }, { subject: '1' }, secret);

const VEHICLE_FIELDS = ['category', 'id', 'make', 'model', 'price', 'quantity'];

describe('GET /api/vehicles', () => {
  const db = new PrismaClient();
  const app = createApp(db);
  const corolla = { make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 5 };
  const soldOut = { make: 'Honda', model: 'Civic', category: 'Sedan', price: 22000.5, quantity: 0 };

  const getAs = (role: 'user' | 'admin') =>
    request(app).get('/api/vehicles').set('Authorization', `Bearer ${signToken(role)}`);

  beforeEach(async () => {
    await db.vehicle.deleteMany();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('returns 200 with all vehicles, including one with quantity 0', async () => {
    await db.vehicle.create({ data: corolla });
    await db.vehicle.create({ data: soldOut });

    const res = await getAs('admin');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: expect.any(Number), ...corolla },
      { id: expect.any(Number), ...soldOut },
    ]);
  });

  it('returns 200 with [] when there are no vehicles', async () => {
    const res = await getAs('admin');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('lets a logged-in user with role "user" list vehicles', async () => {
    await db.vehicle.create({ data: corolla });

    const res = await getAs('user');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns items with the same fields as create and never createdAt', async () => {
    await db.vehicle.create({ data: corolla });

    const res = await getAs('user');

    expect(res.status).toBe(200);
    expect(Object.keys(res.body[0]).sort()).toEqual(VEHICLE_FIELDS);
    expect(res.body[0]).not.toHaveProperty('createdAt');
  });

  it('returns 401 when no token is sent', async () => {
    const res = await request(app).get('/api/vehicles');

    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const forged = signToken('user', 'some-other-secret');

    const res = await request(app).get('/api/vehicles').set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });
});
