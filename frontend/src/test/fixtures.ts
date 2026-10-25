import type { Session } from '../auth/session';

export const regularUser = { id: 1, email: 'driver@example.com', role: 'user' as const };

export const userSession: Session = { token: 'test-token', user: regularUser };

export const adminUser = { id: 9, email: 'admin@example.com', role: 'admin' as const };

export const adminSession: Session = { token: 'admin-token', user: adminUser };

export const corolla = { id: 1, make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 22000, quantity: 2 };
export const civic = { id: 2, make: 'Honda', model: 'Civic', category: 'Sedan', price: 24000, quantity: 0 };

/** The response the dashboard's first request gets when the test does not care about vehicles. */
export const emptyInventory = { status: 200, body: [] };
