import { NewVehicle, Vehicle, VehicleRepository } from '../repositories/vehicleRepository';

export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  /** Adds a vehicle to the inventory. Input is expected to be validated already. */
  async create(data: NewVehicle): Promise<Vehicle> {
    return this.vehicles.create(data);
  }
}
