import { apiRequest } from './client';
import type { Session, User } from '../auth/session';

export interface Credentials {
  email: string;
  password: string;
}

export function loginRequest(credentials: Credentials): Promise<Session> {
  return apiRequest<Session>('/api/auth/login', { method: 'POST', body: credentials });
}

export function registerRequest(credentials: Credentials): Promise<User> {
  return apiRequest<User>('/api/auth/register', { method: 'POST', body: credentials });
}
