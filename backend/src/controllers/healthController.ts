import { Request, Response } from 'express';
import { HealthService } from '../services/healthService';
import { HttpStatus } from '../httpStatus';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = async (_req: Request, res: Response): Promise<void> => {
    const report = await this.healthService.check();
    res
      .status(report.healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json({ status: report.healthy ? 'ok' : 'error', database: report.database });
  };
}
