import { execSync } from 'node:child_process';

/** Recreates the test database from the Prisma schema once per test run. */
export default function globalSetup(): void {
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'ignore',
  });
}
