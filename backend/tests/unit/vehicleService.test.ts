import { VehicleService } from '../../src/services/vehicleService';
import { NewVehicle, Vehicle, VehicleRepository } from '../../src/repositories/vehicleRepository';

/** In-memory stand-in for the Prisma repository. */
class FakeVehicleRepository implements VehicleRepository {
  readonly vehicles: Vehicle[] = [];

  async create(data: NewVehicle): Promise<Vehicle> {
    const vehicle: Vehicle = { id: this.vehicles.length + 1, ...data };
    this.vehicles.push(vehicle);
    return vehicle;
  }
}

const corolla: NewVehicle = { make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 5 };

describe('VehicleService.create', () => {
  let repository: FakeVehicleRepository;
  let service: VehicleService;

  beforeEach(() => {
    repository = new FakeVehicleRepository();
    service = new VehicleService(repository);
  });

  it('returns the created vehicle with its new id', async () => {
    const vehicle = await service.create(corolla);

    expect(vehicle).toEqual({ id: 1, ...corolla });
  });

  it('saves the vehicle through the repository', async () => {
    await service.create(corolla);

    expect(repository.vehicles).toEqual([{ id: 1, ...corolla }]);
  });

  it('gives each created vehicle its own id', async () => {
    const first = await service.create(corolla);
    const second = await service.create({ ...corolla, model: 'Camry' });

    expect(second.id).not.toBe(first.id);
  });
});
