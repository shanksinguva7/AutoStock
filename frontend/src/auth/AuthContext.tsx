import { createContext, useContext, useState, type ReactNode } from 'react';
import { loginRequest, registerRequest, type Credentials } from '../api/authApi';
import { clearSession, loadSession, saveSession, type User } from './session';

interface AuthContextValue {
  user: User | null;
  login(credentials: Credentials): Promise<void>;
  register(credentials: Credentials): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadSession()?.user ?? null);

  async function login(credentials: Credentials) {
    const session = await loginRequest(credentials);
    saveSession(session);
    setUser(session.user);
  }

  // Register returns no token, so sign the new user in straight away.
  async function register(credentials: Credentials) {
    await registerRequest(credentials);
    await login(credentials);
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return value;
}
