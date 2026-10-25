import { Prisma, PrismaClient } from '@prisma/client';

// Prisma's error code for an update or delete whose target row does not exist.
const RECORD_NOT_FOUND = 'P2025';

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

export type NewVehicle = Omit<Vehicle, 'id'>;

/** Optional search filters; an omitted filter matches every vehicle. */
export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface VehicleRepository {
  create(data: NewVehicle): Promise<Vehicle>;
  findAll(): Promise<Vehicle[]>;
  findById(id: number): Promise<Vehicle | null>;
  /** Text filters match case-insensitively anywhere in the field; price bounds are inclusive. */
  search(filters: VehicleFilters): Promise<Vehicle[]>;
  /**
   * Takes one unit off the stock if at least one is left.
   * Returns the updated vehicle, or null when nothing changed (unknown id or out of stock).
   */
  decrementIfInStock(id: number): Promise<Vehicle | null>;
  /** Adds `amount` units to the stock. Returns the updated vehicle, or null for an unknown id. */
  incrementQuantity(id: number, amount: number): Promise<Vehicle | null>;
  /** Replaces every field of a vehicle. Returns the updated vehicle, or null for an unknown id. */
  update(id: number, data: NewVehicle): Promise<Vehicle | null>;
  /** Removes a vehicle. Returns the deleted vehicle, or null for an unknown id. */
  delete(id: number): Promise<Vehicle | null>;
}

export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: NewVehicle): Promise<Vehicle> {
    return toVehicle(await this.db.vehicle.create({ data }));
  }

  async findAll(): Promise<Vehicle[]> {
    return this.search({});
  }

  async search({ make, model, category, minPrice, maxPrice }: VehicleFilters): Promise<Vehicle[]> {
    // Prisma skips any condition whose value is undefined, so omitted filters match everything.
    const rows = await this.db.vehicle.findMany({
      where: {
        make: { contains: make },
        model: { contains: model },
        category: { contains: category },
        price: { gte: minPrice, lte: maxPrice },
      },
      // Ordered by id so results are stable and new vehicles appear last.
      orderBy: { id: 'asc' },
    });
    return rows.map(toVehicle);
  }

  async findById(id: number): Promise<Vehicle | null> {
    const row = await this.db.vehicle.findUnique({ where: { id } });
    return row && toVehicle(row);
  }

  async decrementIfInStock(id: number): Promise<Vehicle | null> {
    // One conditional UPDATE: the stock check and the decrement happen in the same
    // statement, so two buyers racing for the last unit cannot both see quantity 1
    // and both succeed. Quantity can never go below 0.
    const { count } = await this.db.vehicle.updateMany({
      where: { id, quantity: { gt: 0 } },
      data: { quantity: { decrement: 1 } },
    });
    return count === 0 ? null : this.findById(id);
  }

  async incrementQuantity(id: number, amount: number): Promise<Vehicle | null> {
    // The database adds to its current value, so concurrent restocks and purchases
    // never overwrite each other, and the returned row is the one this update wrote.
    return nullIfNotFound(
      this.db.vehicle.update({ where: { id }, data: { quantity: { increment: amount } } }),
    );
  }

  async update(id: number, data: NewVehicle): Promise<Vehicle | null> {
    return nullIfNotFound(this.db.vehicle.update({ where: { id }, data }));
  }

  async delete(id: number): Promise<Vehicle | null> {
    return nullIfNotFound(this.db.vehicle.delete({ where: { id } }));
  }
}

/** Runs a Prisma update or delete by id, turning "record not found" into null. */
async function nullIfNotFound(query: Promise<Vehicle>): Promise<Vehicle | null> {
  try {
    return toVehicle(await query);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === RECORD_NOT_FOUND) {
      return null;
    }
    throw error;
  }
}

// Keeps DB-only columns such as createdAt out of the API shape.
function toVehicle({ id, make, model, category, price, quantity }: Vehicle): Vehicle {
  return { id, make, model, category, price, quantity };
}
