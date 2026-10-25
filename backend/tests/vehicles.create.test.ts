import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';
import { signTestToken } from './helpers/tokens';

const signToken = (role: 'user' | 'admin', secret?: string) =>
  signTestToken({ role }, { subject: '1' }, secret);

describe('POST /api/vehicles', () => {
  const db = new PrismaClient();
  const app = createApp(db);
  const validVehicle = { make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 5 };

  const postAsAdmin = (body: object) =>
    request(app).post('/api/vehicles').set('Authorization', `Bearer ${signToken('admin')}`).send(body);

  beforeEach(async () => {
    await db.vehicle.deleteMany();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('returns 201 with the created vehicle for an admin', async () => {
    const res = await postAsAdmin(validVehicle);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), ...validVehicle });
  });

  it('stores the vehicle in the database', async () => {
    const res = await postAsAdmin(validVehicle);

    const stored = await db.vehicle.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(stored).toMatchObject(validVehicle);
  });

  it('accepts a price of 0 and a quantity of 0', async () => {
    const res = await postAsAdmin({ ...validVehicle, price: 0, quantity: 0 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ price: 0, quantity: 0 });
  });

  it('accepts a decimal price', async () => {
    const res = await postAsAdmin({ ...validVehicle, price: 19999.99 });

    expect(res.status).toBe(201);
    expect(res.body.price).toBe(19999.99);
  });

  it('ignores an id sent by the client', async () => {
    const res = await postAsAdmin({ ...validVehicle, id: 9999 });

    expect(res.status).toBe(201);
    expect(res.body.id).not.toBe(9999);
  });

  describe('validation', () => {
    it.each(['make', 'model', 'category', 'price', 'quantity'])(
      'returns 400 when %s is missing',
      async (field) => {
        const { [field]: _omitted, ...body } = validVehicle as Record<string, unknown>;

        const res = await postAsAdmin(body);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
      },
    );

    it.each(['make', 'model', 'category'])('returns 400 when %s is blank', async (field) => {
      const res = await postAsAdmin({ ...validVehicle, [field]: '   ' });

      expect(res.status).toBe(400);
    });

    it.each([
      ['a non-numeric price', { price: 'abc' }],
      ['a numeric string price', { price: '20000' }],
      ['a negative price', { price: -1 }],
      ['a non-integer quantity', { quantity: 1.5 }],
      ['a negative quantity', { quantity: -1 }],
      ['a string quantity', { quantity: '5' }],
    ])('returns 400 for %s', async (_label, override) => {
      const res = await postAsAdmin({ ...validVehicle, ...override });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('does not store anything when validation fails', async () => {
      await postAsAdmin({ ...validVehicle, price: -1 });

      expect(await db.vehicle.count()).toBe(0);
    });
  });

  describe('auth', () => {
    it('returns 401 when no token is sent', async () => {
      const res = await request(app).post('/api/vehicles').send(validVehicle);

      expect(res.status).toBe(401);
    });

    it('returns 401 for a token signed with a different secret', async () => {
      const forged = signToken('admin', 'some-other-secret');

      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${forged}`)
        .send(validVehicle);

      expect(res.status).toBe(401);
    });

    it('returns 403 for a valid non-admin token and stores nothing', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${signToken('user')}`)
        .send(validVehicle);

      expect(res.status).toBe(403);
      expect(await db.vehicle.count()).toBe(0);
    });
  });
});
