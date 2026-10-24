import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';

/** Builds the Express app. The DB client is injected so tests can pass their own. */
export function createApp(db: PrismaClient): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', async (_req, res) => {
    try {
      await db.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'error', database: 'down' });
    }
  });

  return app;
}
