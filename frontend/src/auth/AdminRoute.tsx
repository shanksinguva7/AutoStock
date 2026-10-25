import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Renders child routes only for admins; other users go back to the dashboard.
 * This only hides UI. The backend still rejects admin requests from non-admins with 403.
 */
export function AdminRoute() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}
