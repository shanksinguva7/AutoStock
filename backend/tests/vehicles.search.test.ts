import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';
import { signRoleToken as signToken } from './helpers/tokens';

// Mixed-case makes on purpose: they prove case-insensitivity against real SQLite rows.
const inventory = [
  { make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 5 },
  { make: 'toyota', model: 'RAV4', category: 'SUV', price: 30000, quantity: 0 },
  { make: 'Honda', model: 'Civic', category: 'Sedan', price: 22000, quantity: 2 },
  { make: 'Ford', model: 'F-150', category: 'Truck', price: 45000, quantity: 1 },
  { make: 'mErCeDeS', model: 'GLE Coupe', category: 'suv', price: 80000, quantity: 3 },
];

describe('GET /api/vehicles/search', () => {
  const db = new PrismaClient();
  const app = createApp(db);

  const search = (query: Record<string, string>) =>
    request(app)
      .get('/api/vehicles/search')
      .query(query)
      .set('Authorization', `Bearer ${signToken('user')}`);

  /** Searches and returns just the matching models, in response order. */
  const modelsFor = async (query: Record<string, string>) => {
    const res = await search(query);
    expect(res.status).toBe(200);
    return res.body.map((vehicle: { model: string }) => vehicle.model);
  };

  beforeAll(async () => {
    await db.vehicle.deleteMany();
    for (const vehicle of inventory) {
      await db.vehicle.create({ data: vehicle });
    }
  });

  afterAll(async () => {
    await db.vehicle.deleteMany();
    await db.$disconnect();
  });

  describe('each filter alone', () => {
    it('filters by make', async () => {
      expect(await modelsFor({ make: 'Honda' })).toEqual(['Civic']);
    });

    it('filters by model', async () => {
      expect(await modelsFor({ model: 'Corolla' })).toEqual(['Corolla']);
    });

    it('filters by category', async () => {
      expect(await modelsFor({ category: 'Truck' })).toEqual(['F-150']);
    });

    it('filters by minPrice, inclusive', async () => {
      expect(await modelsFor({ minPrice: '45000' })).toEqual(['F-150', 'GLE Coupe']);
    });

    it('filters by maxPrice, inclusive', async () => {
      expect(await modelsFor({ maxPrice: '22000' })).toEqual(['Corolla', 'Civic']);
    });
  });

  describe('combined filters', () => {
    it('combines make and maxPrice', async () => {
      expect(await modelsFor({ make: 'toyota', maxPrice: '25000' })).toEqual(['Corolla']);
    });

    it('combines category with a price range', async () => {
      expect(await modelsFor({ category: 'sedan', minPrice: '21000', maxPrice: '30000' })).toEqual([
        'Civic',
      ]);
    });

    it('accepts minPrice equal to maxPrice', async () => {
      expect(await modelsFor({ minPrice: '30000', maxPrice: '30000' })).toEqual(['RAV4']);
    });
  });

  describe('case-insensitive contains', () => {
    it('matches part of a make, so "toy" finds Toyota and toyota', async () => {
      expect(await modelsFor({ make: 'toy' })).toEqual(['Corolla', 'RAV4']);
    });

    it('matches an upper-case query, so "TOYOTA" finds both Toyotas', async () => {
      expect(await modelsFor({ make: 'TOYOTA' })).toEqual(['Corolla', 'RAV4']);
    });

    it('matches mixed-case stored data, so "MERCEDES" finds "mErCeDeS"', async () => {
      expect(await modelsFor({ make: 'MERCEDES' })).toEqual(['GLE Coupe']);
    });

    it('matches the middle of a model and category regardless of case', async () => {
      expect(await modelsFor({ model: 'COUP', category: 'SuV' })).toEqual(['GLE Coupe']);
    });
  });

  it('includes vehicles with quantity 0', async () => {
    const res = await search({ model: 'RAV4' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: expect.any(Number), ...inventory[1] }]);
  });

  it('returns 200 with [] when nothing matches', async () => {
    const res = await search({ make: 'Lamborghini' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all vehicles when no filters are given', async () => {
    expect(await modelsFor({})).toEqual(inventory.map((vehicle) => vehicle.model));
  });

  it('ignores blank filter values', async () => {
    expect(await modelsFor({ make: '', model: '   ', minPrice: '', maxPrice: ' ' })).toEqual(
      inventory.map((vehicle) => vehicle.model),
    );
  });

  describe('validation', () => {
    it.each([
      ['a non-numeric minPrice', { minPrice: 'cheap' }],
      ['a non-numeric maxPrice', { maxPrice: '10k' }],
      ['a negative minPrice', { minPrice: '-1' }],
      ['a negative maxPrice', { maxPrice: '-500' }],
      ['minPrice greater than maxPrice', { minPrice: '50000', maxPrice: '10000' }],
    ])('returns 400 for %s', async (_label, query) => {
      const res = await search(query);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('auth', () => {
    it('returns 401 when no token is sent', async () => {
      const res = await request(app).get('/api/vehicles/search').query({ make: 'Toyota' });

      expect(res.status).toBe(401);
    });

    it('returns 401 for a token signed with a different secret', async () => {
      const forged = signToken('user', 'some-other-secret');

      const res = await request(app)
        .get('/api/vehicles/search')
        .set('Authorization', `Bearer ${forged}`);

      expect(res.status).toBe(401);
    });
  });

  it('is not shadowed by /:id, so "search" is never parsed as a vehicle id', async () => {
    const res = await search({});

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
