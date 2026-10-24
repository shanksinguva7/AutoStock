import bcrypt from 'bcrypt';
import { User, UserRepository } from '../repositories/userRepository';
import { ConflictError } from '../errors';

const BCRYPT_ROUNDS = 10;

export type PublicUser = Omit<User, 'passwordHash'>;

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  /**
   * Creates a user with the default role and a bcrypt-hashed password.
   * @throws ConflictError when the email is already registered.
   */
  async register(email: string, password: string): Promise<PublicUser> {
    const normalisedEmail = normaliseEmail(email);
    if (await this.users.findByEmail(normalisedEmail)) {
      throw new ConflictError('Email is already registered');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.users.create({ email: normalisedEmail, passwordHash });
    return toPublicUser(user);
  }
}

// Emails are compared case-insensitively, so store one canonical form.
function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Strips the password hash so it can never reach an API response. */
function toPublicUser({ id, email, role }: User): PublicUser {
  return { id, email, role };
}
