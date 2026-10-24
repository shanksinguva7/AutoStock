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
    const normalisedEmail = email.trim().toLowerCase();
    if (await this.users.findByEmail(normalisedEmail)) {
      throw new ConflictError('Email is already registered');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const { passwordHash: _hash, ...publicUser } = await this.users.create({
      email: normalisedEmail,
      passwordHash,
    });
    return publicUser;
  }
}
