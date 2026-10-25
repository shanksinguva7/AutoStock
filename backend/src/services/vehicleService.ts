import { ConflictError, NotFoundError } from '../errors';
import { NewVehicle, Vehicle, VehicleFilters, VehicleRepository } from '../repositories/vehicleRepository';

const VEHICLE_NOT_FOUND = 'Vehicle not found';

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

  /** Returns vehicles matching every given filter, including sold-out ones. */
  async search(filters: VehicleFilters): Promise<Vehicle[]> {
    return this.vehicles.search(filters);
  }

  async update(_id: number, _data: NewVehicle): Promise<Vehicle> {
    throw new Error('Not implemented');
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
      throw new NotFoundError(VEHICLE_NOT_FOUND);
    }
    throw new ConflictError('Vehicle is out of stock');
  }

  /**
   * Adds units to a vehicle's stock. The amount is expected to be a validated positive integer.
   * @throws NotFoundError when no vehicle has this id.
   */
  async restock(id: number, amount: number): Promise<Vehicle> {
    const updated = await this.vehicles.incrementQuantity(id, amount);
    if (!updated) {
      throw new NotFoundError(VEHICLE_NOT_FOUND);
    }
    return updated;
  }
}
