import { PrismaClient } from '@prisma/client';

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

export type NewVehicle = Omit<Vehicle, 'id'>;

export interface VehicleRepository {
  create(data: NewVehicle): Promise<Vehicle>;
}

export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: NewVehicle): Promise<Vehicle> {
    return toVehicle(await this.db.vehicle.create({ data }));
  }
}

// Keeps DB-only columns such as createdAt out of the API shape.
function toVehicle({ id, make, model, category, price, quantity }: Vehicle): Vehicle {
  return { id, make, model, category, price, quantity };
}
