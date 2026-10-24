import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserRepository } from '../repositories/userRepository';
import { ConflictError, UnauthorizedError } from '../errors';
import { AuthConfig } from '../config';

const BCRYPT_ROUNDS = 10;
const INVALID_CREDENTIALS = 'Invalid email or password';
// Compared against when the email is unknown, so both failure paths cost one bcrypt check.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equaliser', BCRYPT_ROUNDS);

export type PublicUser = Omit<User, 'passwordHash'>;

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly config: AuthConfig,
  ) {}

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

  /**
   * Verifies credentials and issues a signed JWT carrying the user id (`sub`) and role.
   * @throws UnauthorizedError with the same message for unknown email and wrong password,
   * so callers cannot tell which emails are registered.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(normaliseEmail(email));
    const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !passwordMatches) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }
    const token = jwt.sign({ role: user.role }, this.config.jwtSecret, {
      subject: String(user.id),
      expiresIn: this.config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
    return { token, user: toPublicUser(user) };
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
