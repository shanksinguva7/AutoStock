import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';
import { signRoleToken as signToken } from './helpers/tokens';

describe('DELETE /api/vehicles/:id', () => {
  const db = new PrismaClient();
  const app = createApp(db);
  const corolla = { make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 5 };
  const civic = { make: 'Honda', model: 'Civic', category: 'Sedan', price: 22000, quantity: 2 };

  const bearer = (role: 'user' | 'admin') => `Bearer ${signToken(role)}`;
  const deleteAs = (role: 'user' | 'admin', id: number | string) =>
    request(app).delete(`/api/vehicles/${id}`).set('Authorization', bearer(role));

  const exists = async (id: number) => (await db.vehicle.findUnique({ where: { id } })) !== null;

  let id: number;

  beforeEach(async () => {
    await db.vehicle.deleteMany();
    ({ id } = await db.vehicle.create({ data: corolla }));
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('returns 204 with an empty body and removes the vehicle from the database', async () => {
    const res = await deleteAs('admin', id);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(await exists(id)).toBe(false);
  });

  it('only removes the requested vehicle', async () => {
    const other = await db.vehicle.create({ data: civic });

    await deleteAs('admin', id);

    expect(await exists(other.id)).toBe(true);
  });

  it('no longer lists the deleted vehicle in GET /api/vehicles or in search', async () => {
    await db.vehicle.create({ data: civic });

    expect((await deleteAs('admin', id)).status).toBe(204);

    const list = await request(app).get('/api/vehicles').set('Authorization', bearer('user'));
    const search = await request(app)
      .get('/api/vehicles/search')
      .query({ make: 'Toyota' })
      .set('Authorization', bearer('user'));
    expect(list.body.map((vehicle: { model: string }) => vehicle.model)).toEqual(['Civic']);
    expect(search.body).toEqual([]);
  });

  it('returns 404 for purchase and restock on a deleted vehicle', async () => {
    expect((await deleteAs('admin', id)).status).toBe(204);

    const purchase = await request(app)
      .post(`/api/vehicles/${id}/purchase`)
      .set('Authorization', bearer('user'));
    const restock = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set('Authorization', bearer('admin'))
      .send({ amount: 1 });

    expect(purchase.status).toBe(404);
    expect(restock.status).toBe(404);
  });

  it('returns 404 for an unknown id', async () => {
    const UNKNOWN_ID = 999999;

    const res = await deleteAs('admin', UNKNOWN_ID);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 when deleting the same vehicle twice', async () => {
    const first = await deleteAs('admin', id);
    const second = await deleteAs('admin', id);

    expect(first.status).toBe(204);
    expect(second.status).toBe(404);
    expect(second.body).toHaveProperty('error');
  });

  it.each(['abc', '1.5', '0'])('returns 400 for the invalid id "%s"', async (badId) => {
    const res = await deleteAs('admin', badId);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  describe('auth', () => {
    it('returns 403 for a non-admin and the vehicle stays in the database', async () => {
      const res = await deleteAs('user', id);

      expect(res.status).toBe(403);
      expect(await exists(id)).toBe(true);
    });

    it('returns 401 when no token is sent', async () => {
      const res = await request(app).delete(`/api/vehicles/${id}`);

      expect(res.status).toBe(401);
      expect(await exists(id)).toBe(true);
    });

    it('returns 401 for a token signed with a different secret', async () => {
      const forged = signToken('admin', 'some-other-secret');

      const res = await request(app).delete(`/api/vehicles/${id}`).set('Authorization', `Bearer ${forged}`);

      expect(res.status).toBe(401);
      expect(await exists(id)).toBe(true);
    });
  });
});
