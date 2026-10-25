import { Request, Response } from 'express';
import { z } from 'zod';
import { VehicleService } from '../services/vehicleService';
import { HttpStatus } from '../httpStatus';
import { parseOrThrow } from '../validation';

// Trim first so a whitespace-only name counts as missing.
const requiredText = z.string().trim().min(1);

// z.number() rejects numeric strings, so clients must send real JSON numbers.
const createVehicleSchema = z.object({
  make: requiredText,
  model: requiredText,
  category: requiredText,
  price: z.number().nonnegative(),
  quantity: z.number().int().nonnegative(),
});

// Route params arrive as strings; coerce, then require a positive whole number.
const vehicleIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Blank query values (e.g. "?make=") are treated as not sent, so they never filter
// on an empty string or coerce to a price of 0.
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalText = z.preprocess(blankToUndefined, z.string().trim().optional());
const optionalPrice = z.preprocess(blankToUndefined, z.coerce.number().nonnegative().optional());

const searchSchema = z
  .object({
    make: optionalText,
    model: optionalText,
    category: optionalText,
    minPrice: optionalPrice,
    maxPrice: optionalPrice,
  })
  .refine(
    ({ minPrice, maxPrice }) => minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { message: 'minPrice must not be greater than maxPrice' },
  );

const restockSchema = z.object({
  amount: z.number().int().positive(),
});

export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const data = parseOrThrow(createVehicleSchema, req.body);
    const vehicle = await this.vehicleService.create(data);
    res.status(HttpStatus.CREATED).json(vehicle);
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    res.status(HttpStatus.OK).json(await this.vehicleService.list());
  };

  search = async (req: Request, res: Response): Promise<void> => {
    const filters = parseOrThrow(searchSchema, req.query);
    res.status(HttpStatus.OK).json(await this.vehicleService.search(filters));
  };

  // PUT replaces the whole vehicle, so it uses the create rules; unknown keys such as id are dropped.
  update = async (req: Request, res: Response): Promise<void> => {
    const id = parseVehicleId(req);
    const data = parseOrThrow(createVehicleSchema, req.body);
    res.status(HttpStatus.OK).json(await this.vehicleService.update(id, data));
  };

  purchase = async (req: Request, res: Response): Promise<void> => {
    res.status(HttpStatus.OK).json(await this.vehicleService.purchase(parseVehicleId(req)));
  };

  restock = async (req: Request, res: Response): Promise<void> => {
    const id = parseVehicleId(req);
    const { amount } = parseOrThrow(restockSchema, req.body);
    res.status(HttpStatus.OK).json(await this.vehicleService.restock(id, amount));
  };
}

/** Reads the `:id` route param as a positive integer, or throws a 400. */
function parseVehicleId(req: Request): number {
  return parseOrThrow(vehicleIdSchema, req.params).id;
}
