import { PrismaClient } from '@prisma/client';

export type Role = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: Role;
}

/** Role is optional: the database defaults it to 'user'. */
export type NewUser = Pick<User, 'email' | 'passwordHash'> & { role?: Role };

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { email } });
    return row && toUser(row);
  }

  async create(data: NewUser): Promise<User> {
    return toUser(await this.db.user.create({ data }));
  }
}

// SQLite has no enums, so role is stored as a plain string.
function toUser(row: { id: number; email: string; passwordHash: string; role: string }): User {
  return { id: row.id, email: row.email, passwordHash: row.passwordHash, role: row.role as Role };
}
