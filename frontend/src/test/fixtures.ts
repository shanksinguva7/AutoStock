import type { Session } from '../auth/session';

export const regularUser = { id: 1, email: 'driver@example.com', role: 'user' as const };

export const userSession: Session = { token: 'test-token', user: regularUser };
