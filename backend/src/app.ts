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
import { errorHandler } from './middleware/errorHandler';
import { loadAuthConfig } from './config';

/** Builds the Express app. The DB client is injected so tests can pass their own. */
export function createApp(db: PrismaClient): Express {
  const app = express();
  app.use(express.json());

  const healthController = new HealthController(new HealthService(new PrismaHealthRepository(db)));
  app.use('/health', healthRoutes(healthController));

  const authController = new AuthController(new AuthService(new PrismaUserRepository(db), loadAuthConfig()));
  app.use('/api/auth', authRoutes(authController));

  // Must be registered last so it catches errors from every route above.
  app.use(errorHandler);

  return app;
}
