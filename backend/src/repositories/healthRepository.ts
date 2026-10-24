import { PrismaClient } from '@prisma/client';

/** Anything that can prove the database answers queries. */
export interface DatabaseProbe {
  ping(): Promise<void>;
}

export class PrismaHealthRepository implements DatabaseProbe {
  constructor(private readonly db: PrismaClient) {}

  async ping(): Promise<void> {
    await this.db.$queryRaw`SELECT 1`;
  }
}
