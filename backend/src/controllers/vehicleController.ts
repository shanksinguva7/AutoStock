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

  purchase = async (req: Request, res: Response): Promise<void> => {
    const { id } = parseOrThrow(vehicleIdSchema, req.params);
    res.status(HttpStatus.OK).json(await this.vehicleService.purchase(id));
  };
}
