import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';
import { signRoleToken as signToken } from './helpers/tokens';

describe('PUT /api/vehicles/:id', () => {
  const db = new PrismaClient();
  const app = createApp(db);
  const original = { make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 5 };
  const replacement = { make: 'Honda', model: 'Civic Type R', category: 'Hatchback', price: 44999.5, quantity: 2 };

  const updateAs = (role: 'user' | 'admin', id: number | string, body: object) =>
    request(app).put(`/api/vehicles/${id}`).set('Authorization', `Bearer ${signToken(role)}`).send(body);

  const storedVehicle = async (id: number) => {
    const { make, model, category, price, quantity } = await db.vehicle.findUniqueOrThrow({ where: { id } });
    return { make, model, category, price, quantity };
  };

  let id: number;

  beforeEach(async () => {
    await db.vehicle.deleteMany();
    ({ id } = await db.vehicle.create({ data: original }));
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('updates all fields and returns 200 with the updated vehicle, saved in the database', async () => {
    const res = await updateAs('admin', id, replacement);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id, ...replacement });
    expect(await storedVehicle(id)).toEqual(replacement);
  });

  it('can set quantity to 0 and price to 0', async () => {
    const res = await updateAs('admin', id, { ...replacement, price: 0, quantity: 0 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ price: 0, quantity: 0 });
  });

  it('does not change the vehicle id when the body sends a different id', async () => {
    const OTHER_ID = id + 1000;

    const res = await updateAs('admin', id, { ...replacement, id: OTHER_ID, createdAt: '2000-01-01' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(await db.vehicle.findUnique({ where: { id: OTHER_ID } })).toBeNull();
    expect(await storedVehicle(id)).toEqual(replacement);
  });

  describe('validation', () => {
    it.each(['make', 'model', 'category', 'price', 'quantity'])(
      'returns 400 when %s is missing and leaves the vehicle unchanged',
      async (field) => {
        const { [field]: _omitted, ...body } = replacement as Record<string, unknown>;

        const res = await updateAs('admin', id, body);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(await storedVehicle(id)).toEqual(original);
      },
    );

    it('returns 400 for an empty body', async () => {
      const res = await updateAs('admin', id, {});

      expect(res.status).toBe(400);
      expect(await storedVehicle(id)).toEqual(original);
    });

    it.each(['make', 'model', 'category'])('returns 400 when %s is blank', async (field) => {
      const res = await updateAs('admin', id, { ...replacement, [field]: '   ' });

      expect(res.status).toBe(400);
    });

    it.each([
      ['a negative price', { price: -1 }],
      ['a non-numeric price', { price: 'abc' }],
      ['a decimal quantity', { quantity: 1.5 }],
      ['a negative quantity', { quantity: -1 }],
      ['a string quantity', { quantity: '5' }],
    ])('returns 400 for %s and leaves the vehicle unchanged', async (_label, override) => {
      const res = await updateAs('admin', id, { ...replacement, ...override });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(await storedVehicle(id)).toEqual(original);
    });

    it.each(['abc', '1.5', '0'])('returns 400 for the invalid id "%s"', async (badId) => {
      const res = await updateAs('admin', badId, replacement);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  it('returns 404 for an unknown id', async () => {
    const UNKNOWN_ID = 999999;

    const res = await updateAs('admin', UNKNOWN_ID, replacement);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  describe('auth', () => {
    it('returns 403 for a non-admin and the vehicle stays unchanged', async () => {
      const res = await updateAs('user', id, replacement);

      expect(res.status).toBe(403);
      expect(await storedVehicle(id)).toEqual(original);
    });

    it('returns 401 when no token is sent', async () => {
      const res = await request(app).put(`/api/vehicles/${id}`).send(replacement);

      expect(res.status).toBe(401);
      expect(await storedVehicle(id)).toEqual(original);
    });

    it('returns 401 for a token signed with a different secret', async () => {
      const forged = signToken('admin', 'some-other-secret');

      const res = await request(app)
        .put(`/api/vehicles/${id}`)
        .set('Authorization', `Bearer ${forged}`)
        .send(replacement);

      expect(res.status).toBe(401);
      expect(await storedVehicle(id)).toEqual(original);
    });
  });
});
