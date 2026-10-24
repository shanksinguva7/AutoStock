import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';

/** Builds the Express app. The DB client is injected so tests can pass their own. */
export function createApp(_db: PrismaClient): Express {
  const app = express();
  app.use(express.json());
  return app;
}
