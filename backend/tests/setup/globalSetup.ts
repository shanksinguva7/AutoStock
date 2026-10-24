import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

// test.db is a throwaway file next to schema.prisma; recreating it gives every run a clean DB.
const TEST_DB_PATH = join(__dirname, '..', '..', 'prisma', 'test.db');

/** Recreates the test database from the Prisma schema once per test run. */
export default function globalSetup(): void {
  rmSync(TEST_DB_PATH, { force: true });
  rmSync(`${TEST_DB_PATH}-journal`, { force: true });
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'ignore',
  });
}
