import { AuthService } from '../../src/services/authService';
import { NewUser, User, UserRepository } from '../../src/repositories/userRepository';
import jwt from 'jsonwebtoken';
import { ConflictError, UnauthorizedError } from '../../src/errors';
import { AuthConfig } from '../../src/config';

/** In-memory stand-in for the Prisma repository. */
class FakeUserRepository implements UserRepository {
  private users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async create(data: NewUser): Promise<User> {
    const user: User = { id: this.users.length + 1, role: 'user', ...data };
    this.users.push(user);
    return user;
  }
}

const authConfig: AuthConfig = { jwtSecret: 'unit-test-secret', jwtExpiresIn: '1h' };

describe('AuthService.register', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(new FakeUserRepository(), authConfig);
  });

  it('returns the public user without the password hash', async () => {
    const user = await service.register('buyer@example.com', 'secret123');

    expect(user).toEqual({ id: 1, email: 'buyer@example.com', role: 'user' });
  });

  it('normalises the email to lower case', async () => {
    const user = await service.register('  Buyer@Example.COM ', 'secret123');

    expect(user.email).toBe('buyer@example.com');
  });

  it('throws ConflictError when the email is taken', async () => {
    await service.register('buyer@example.com', 'secret123');

    await expect(service.register('buyer@example.com', 'other-pass')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});

describe('AuthService.login', () => {
  let service: AuthService;

  beforeEach(async () => {
    service = new AuthService(new FakeUserRepository(), authConfig);
    await service.register('buyer@example.com', 'secret123');
  });

  it('returns a token signed with the configured secret', async () => {
    const { token, user } = await service.login('buyer@example.com', 'secret123');

    const payload = jwt.verify(token, authConfig.jwtSecret) as jwt.JwtPayload;
    expect(payload.sub).toBe(String(user.id));
    expect(payload.role).toBe('user');
  });

  it('throws UnauthorizedError for a wrong password', async () => {
    await expect(service.login('buyer@example.com', 'wrong-pass')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('throws UnauthorizedError for an unknown email', async () => {
    await expect(service.login('nobody@example.com', 'secret123')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
