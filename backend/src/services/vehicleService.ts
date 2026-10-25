import { ConflictError, NotFoundError } from '../errors';
import { NewVehicle, Vehicle, VehicleRepository } from '../repositories/vehicleRepository';

export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  /** Adds a vehicle to the inventory. Input is expected to be validated already. */
  async create(data: NewVehicle): Promise<Vehicle> {
    return this.vehicles.create(data);
  }

  /** Returns every vehicle, including sold-out ones (quantity 0) so the UI can show them. */
  async list(): Promise<Vehicle[]> {
    return this.vehicles.findAll();
  }

  /**
   * Sells one unit of a vehicle.
   * @throws NotFoundError when no vehicle has this id.
   * @throws ConflictError when the vehicle is out of stock.
   */
  async purchase(id: number): Promise<Vehicle> {
    const updated = await this.vehicles.decrementIfInStock(id);
    if (updated) {
      return updated;
    }
    // Nothing changed, so look up the vehicle only to pick the right error.
    if (!(await this.vehicles.findById(id))) {
      throw new NotFoundError('Vehicle not found');
    }
    throw new ConflictError('Vehicle is out of stock');
  }
}
