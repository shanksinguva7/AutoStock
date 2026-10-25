import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';
import { signRoleToken as signToken } from './helpers/tokens';

describe('POST /api/vehicles/:id/restock', () => {
  const db = new PrismaClient();
  const app = createApp(db);
  const corolla = { make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 3 };

  const restockAs = (role: 'user' | 'admin', id: number | string, body: object) =>
    request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set('Authorization', `Bearer ${signToken(role)}`)
      .send(body);

  const quantityOf = async (id: number) =>
    (await db.vehicle.findUniqueOrThrow({ where: { id } })).quantity;

  beforeEach(async () => {
    await db.vehicle.deleteMany();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('increases quantity by amount and returns 200 with the updated vehicle', async () => {
    const { id } = await db.vehicle.create({ data: corolla });

    const res = await restockAs('admin', id, { amount: 4 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id, ...corolla, quantity: 7 });
    expect(await quantityOf(id)).toBe(7);
  });

  it('restocks a sold-out vehicle at quantity 0', async () => {
    const { id } = await db.vehicle.create({ data: { ...corolla, quantity: 0 } });

    const res = await restockAs('admin', id, { amount: 2 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(2);
    expect(await quantityOf(id)).toBe(2);
  });

  it.each([
    ['amount 0', { amount: 0 }],
    ['a negative amount', { amount: -3 }],
    ['a decimal amount', { amount: 1.5 }],
    ['a string amount', { amount: '5' }],
    ['a missing amount', {}],
  ])('returns 400 for %s and leaves quantity unchanged', async (_label, body) => {
    const { id } = await db.vehicle.create({ data: corolla });

    const res = await restockAs('admin', id, body);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(await quantityOf(id)).toBe(corolla.quantity);
  });

  it.each(['abc', '1.5', '0'])('returns 400 for the invalid id "%s"', async (badId) => {
    const res = await restockAs('admin', badId, { amount: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 for an unknown id', async () => {
    const UNKNOWN_ID = 999999;

    const res = await restockAs('admin', UNKNOWN_ID, { amount: 1 });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 403 for a non-admin and quantity stays unchanged', async () => {
    const { id } = await db.vehicle.create({ data: corolla });

    const res = await restockAs('user', id, { amount: 5 });

    expect(res.status).toBe(403);
    expect(await quantityOf(id)).toBe(corolla.quantity);
  });

  it('returns 401 when no token is sent', async () => {
    const { id } = await db.vehicle.create({ data: corolla });

    const res = await request(app).post(`/api/vehicles/${id}/restock`).send({ amount: 5 });

    expect(res.status).toBe(401);
    expect(await quantityOf(id)).toBe(corolla.quantity);
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const { id } = await db.vehicle.create({ data: corolla });
    const forged = signToken('admin', 'some-other-secret');

    const res = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set('Authorization', `Bearer ${forged}`)
      .send({ amount: 5 });

    expect(res.status).toBe(401);
    expect(await quantityOf(id)).toBe(corolla.quantity);
  });
});
