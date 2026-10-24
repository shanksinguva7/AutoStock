import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from '../repositories/userRepository';
import { AuthService } from '../services/authService';
import { loadAdminCredentials, loadAuthConfig } from '../config';

/** Creates the demo admin if it does not exist yet. Running it again changes nothing. */
export async function seed(db: PrismaClient, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const { email, password } = loadAdminCredentials(env);
  const authService = new AuthService(new PrismaUserRepository(db), loadAuthConfig(env));
  const { created } = await authService.ensureAdmin(email, password);
  console.log(created ? `Created admin ${email}` : `Admin ${email} already exists, nothing to do`);
}

if (require.main === module) {
  const db = new PrismaClient();
  seed(db)
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
