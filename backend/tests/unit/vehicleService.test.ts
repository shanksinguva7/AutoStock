import { VehicleService } from '../../src/services/vehicleService';
import { NewVehicle, Vehicle, VehicleFilters, VehicleRepository } from '../../src/repositories/vehicleRepository';

/** In-memory stand-in for the Prisma repository. */
class FakeVehicleRepository implements VehicleRepository {
  readonly vehicles: Vehicle[] = [];

  async create(data: NewVehicle): Promise<Vehicle> {
    const vehicle: Vehicle = { id: this.vehicles.length + 1, ...data };
    this.vehicles.push(vehicle);
    return vehicle;
  }

  async findAll(): Promise<Vehicle[]> {
    return [...this.vehicles];
  }

  async findById(id: number): Promise<Vehicle | null> {
    return this.vehicles.find((vehicle) => vehicle.id === id) ?? null;
  }

  // Mirrors the real repository's contract: only changes stock when a unit is left.
  async decrementIfInStock(id: number): Promise<Vehicle | null> {
    const vehicle = await this.findById(id);
    if (!vehicle || vehicle.quantity === 0) {
      return null;
    }
    vehicle.quantity -= 1;
    return { ...vehicle };
  }

  async incrementQuantity(id: number, amount: number): Promise<Vehicle | null> {
    const vehicle = await this.findById(id);
    if (!vehicle) {
      return null;
    }
    vehicle.quantity += amount;
    return { ...vehicle };
  }

  // Simplified in-memory version of the real filter semantics.
  async update(id: number, data: NewVehicle): Promise<Vehicle | null> {
    const vehicle = await this.findById(id);
    if (!vehicle) {
      return null;
    }
    Object.assign(vehicle, data);
    return { ...vehicle };
  }

  async search(filters: VehicleFilters): Promise<Vehicle[]> {
    return this.vehicles.filter(
      (vehicle) =>
        (filters.make === undefined || vehicle.make.toLowerCase().includes(filters.make.toLowerCase())) &&
        (filters.maxPrice === undefined || vehicle.price <= filters.maxPrice),
    );
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

describe('VehicleService.list', () => {
  let repository: FakeVehicleRepository;
  let service: VehicleService;

  beforeEach(() => {
    repository = new FakeVehicleRepository();
    service = new VehicleService(repository);
  });

  it('returns every vehicle, including ones with quantity 0', async () => {
    await repository.create(corolla);
    await repository.create({ ...corolla, model: 'Camry', quantity: 0 });

    const vehicles = await service.list();

    expect(vehicles).toEqual([
      { id: 1, ...corolla },
      { id: 2, ...corolla, model: 'Camry', quantity: 0 },
    ]);
  });

  it('returns an empty list when there are no vehicles', async () => {
    await expect(service.list()).resolves.toEqual([]);
  });
});

describe('VehicleService.purchase', () => {
  let repository: FakeVehicleRepository;
  let service: VehicleService;

  beforeEach(() => {
    repository = new FakeVehicleRepository();
    service = new VehicleService(repository);
  });

  it('returns the vehicle with its quantity reduced by one', async () => {
    const { id } = await repository.create(corolla);

    await expect(service.purchase(id)).resolves.toEqual({ id, ...corolla, quantity: 4 });
    expect(repository.vehicles[0].quantity).toBe(4);
  });

  it('rejects with a 409 conflict when the vehicle is out of stock', async () => {
    const { id } = await repository.create({ ...corolla, quantity: 0 });

    await expect(service.purchase(id)).rejects.toMatchObject({ status: 409 });
    expect(repository.vehicles[0].quantity).toBe(0);
  });

  it('rejects with a 404 not found when the vehicle does not exist', async () => {
    const UNKNOWN_ID = 42;

    await expect(service.purchase(UNKNOWN_ID)).rejects.toMatchObject({ status: 404 });
  });
});

describe('VehicleService.restock', () => {
  let repository: FakeVehicleRepository;
  let service: VehicleService;

  beforeEach(() => {
    repository = new FakeVehicleRepository();
    service = new VehicleService(repository);
  });

  it('returns the vehicle with its quantity increased by the amount', async () => {
    const { id } = await repository.create(corolla);

    await expect(service.restock(id, 3)).resolves.toEqual({ id, ...corolla, quantity: 8 });
    expect(repository.vehicles[0].quantity).toBe(8);
  });

  it('restocks a vehicle that is sold out', async () => {
    const { id } = await repository.create({ ...corolla, quantity: 0 });

    await expect(service.restock(id, 2)).resolves.toMatchObject({ quantity: 2 });
  });

  it('rejects with a 404 not found when the vehicle does not exist', async () => {
    const UNKNOWN_ID = 42;

    await expect(service.restock(UNKNOWN_ID, 1)).rejects.toMatchObject({ status: 404 });
  });
});

describe('VehicleService.search', () => {
  let repository: FakeVehicleRepository;
  let service: VehicleService;

  beforeEach(async () => {
    repository = new FakeVehicleRepository();
    service = new VehicleService(repository);
    await repository.create(corolla);
    await repository.create({ ...corolla, make: 'Honda', model: 'Civic', price: 22000, quantity: 0 });
  });

  it('returns the vehicles the repository matches for the given filters', async () => {
    await expect(service.search({ make: 'honda' })).resolves.toEqual([
      { id: 2, ...corolla, make: 'Honda', model: 'Civic', price: 22000, quantity: 0 },
    ]);
  });

  it('passes combined filters through to the repository', async () => {
    await expect(service.search({ make: 'o', maxPrice: 21000 })).resolves.toEqual([{ id: 1, ...corolla }]);
  });

  it('returns every vehicle when no filters are given', async () => {
    await expect(service.search({})).resolves.toHaveLength(2);
  });

  it('returns an empty list when nothing matches', async () => {
    await expect(service.search({ make: 'Ford' })).resolves.toEqual([]);
  });
});

describe('VehicleService.update', () => {
  const civic: NewVehicle = { make: 'Honda', model: 'Civic', category: 'Hatchback', price: 25000, quantity: 1 };
  let repository: FakeVehicleRepository;
  let service: VehicleService;

  beforeEach(() => {
    repository = new FakeVehicleRepository();
    service = new VehicleService(repository);
  });

  it('replaces every field and returns the updated vehicle with the same id', async () => {
    const { id } = await repository.create(corolla);

    await expect(service.update(id, civic)).resolves.toEqual({ id, ...civic });
    expect(repository.vehicles).toEqual([{ id, ...civic }]);
  });

  it('rejects with a 404 not found when the vehicle does not exist', async () => {
    const UNKNOWN_ID = 42;

    await expect(service.update(UNKNOWN_ID, civic)).rejects.toMatchObject({ status: 404 });
  });
});
