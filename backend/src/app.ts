import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaHealthRepository } from './repositories/healthRepository';
import { HealthService } from './services/healthService';
import { HealthController } from './controllers/healthController';
import { healthRoutes } from './routes/healthRoutes';
import { PrismaUserRepository } from './repositories/userRepository';
import { AuthService } from './services/authService';
import { AuthController } from './controllers/authController';
import { authRoutes } from './routes/authRoutes';
import { PrismaVehicleRepository } from './repositories/vehicleRepository';
import { VehicleService } from './services/vehicleService';
import { VehicleController } from './controllers/vehicleController';
import { vehicleRoutes } from './routes/vehicleRoutes';
import { errorHandler } from './middleware/errorHandler';
import { createRequireAuth } from './middleware/auth';
import { loadAuthConfig } from './config';

/** Builds the Express app. The DB client is injected so tests can pass their own. */
export function createApp(db: PrismaClient): Express {
  const app = express();
  app.use(express.json());

  const healthController = new HealthController(new HealthService(new PrismaHealthRepository(db)));
  app.use('/health', healthRoutes(healthController));

  // Loaded once so login and the auth guard always sign and verify with the same secret.
  const authConfig = loadAuthConfig();
  const authService = new AuthService(new PrismaUserRepository(db), authConfig);
  app.use('/api/auth', authRoutes(new AuthController(authService)));

  const vehicleController = new VehicleController(new VehicleService(new PrismaVehicleRepository(db)));
  app.use('/api/vehicles', vehicleRoutes(vehicleController, createRequireAuth(authConfig)));

  // Must be registered last so it catches errors from every route above.
  app.use(errorHandler);

  return app;
}
