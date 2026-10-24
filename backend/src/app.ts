import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaHealthRepository } from './repositories/healthRepository';
import { HealthService } from './services/healthService';
import { HealthController } from './controllers/healthController';
import { healthRoutes } from './routes/healthRoutes';

/** Builds the Express app. The DB client is injected so tests can pass their own. */
export function createApp(db: PrismaClient): Express {
  const app = express();
  app.use(express.json());

  const healthController = new HealthController(new HealthService(new PrismaHealthRepository(db)));
  app.use('/health', healthRoutes(healthController));

  return app;
}
