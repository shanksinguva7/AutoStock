import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';
import { signRoleToken as signToken } from './helpers/tokens';

describe('POST /api/vehicles/:id/purchase', () => {
  const db = new PrismaClient();
  const app = createApp(db);
  const corolla = { make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 3 };

  const purchase = (id: number | string) =>
    request(app).post(`/api/vehicles/${id}/purchase`).set('Authorization', `Bearer ${signToken('user')}`);

  const quantityOf = async (id: number) =>
    (await db.vehicle.findUniqueOrThrow({ where: { id } })).quantity;

  beforeEach(async () => {
    await db.vehicle.deleteMany();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('decrements quantity by exactly one and returns 200 with the updated vehicle', async () => {
    const { id } = await db.vehicle.create({ data: corolla });

    const res = await purchase(id);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id, ...corolla, quantity: 2 });
    expect(await quantityOf(id)).toBe(2);
  });

  it('returns 409 when quantity is 0, and quantity stays 0', async () => {
    const { id } = await db.vehicle.create({ data: { ...corolla, quantity: 0 } });

    const res = await purchase(id);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
    expect(await quantityOf(id)).toBe(0);
  });

  it('returns 404 for an unknown id', async () => {
    const UNKNOWN_ID = 999999;

    const res = await purchase(UNKNOWN_ID);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it.each(['abc', '1.5', '0'])('returns 400 for the invalid id "%s"', async (badId) => {
    const res = await purchase(badId);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 when no token is sent', async () => {
    const { id } = await db.vehicle.create({ data: corolla });

    const res = await request(app).post(`/api/vehicles/${id}/purchase`);

    expect(res.status).toBe(401);
    expect(await quantityOf(id)).toBe(corolla.quantity);
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const { id } = await db.vehicle.create({ data: corolla });
    const forged = signToken('user', 'some-other-secret');

    const res = await request(app)
      .post(`/api/vehicles/${id}/purchase`)
      .set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
    expect(await quantityOf(id)).toBe(corolla.quantity);
  });

  it('sells the last unit exactly once when two purchases race for it', async () => {
    const { id } = await db.vehicle.create({ data: { ...corolla, quantity: 1 } });

    const responses = await Promise.all([purchase(id), purchase(id)]);

    const statuses = responses.map((res) => res.status).sort();
    expect(statuses).toEqual([200, 409]);
    expect(await quantityOf(id)).toBe(0);
  });
});
