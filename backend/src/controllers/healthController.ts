import { Request, Response } from 'express';
import { HealthService } from '../services/healthService';

const HTTP_OK = 200;
const HTTP_SERVICE_UNAVAILABLE = 503;

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = async (_req: Request, res: Response): Promise<void> => {
    const report = await this.healthService.check();
    res
      .status(report.healthy ? HTTP_OK : HTTP_SERVICE_UNAVAILABLE)
      .json({ status: report.healthy ? 'ok' : 'error', database: report.database });
  };
}
