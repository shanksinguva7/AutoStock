import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Renders child routes only for a signed-in user; everyone else goes to /login. */
export function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
