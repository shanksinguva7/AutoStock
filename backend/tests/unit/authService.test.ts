import { AuthService } from '../../src/services/authService';
import { NewUser, User, UserRepository } from '../../src/repositories/userRepository';
import { ConflictError } from '../../src/errors';

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

describe('AuthService.register', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(new FakeUserRepository());
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
