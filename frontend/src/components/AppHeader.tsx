import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { secondaryButton } from './styles';

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'text-ink underline underline-offset-8' : 'text-ink-muted hover:text-ink';
}

/** Top bar for signed-in pages: app name, navigation, the current user's email and log out. */
export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-8">
      <div className="flex items-center gap-6">
        <span className="text-sm tracking-[0.4em] uppercase">AutoStock</span>
        <nav aria-label="Main" className="flex gap-4 text-sm">
          <NavLink to="/" end className={navLinkClass}>
            Inventory
          </NavLink>
          {/* Hidden for non-admins; the backend enforces the role regardless. */}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-ink-muted">{user?.email}</span>
        <button type="button" onClick={logout} className={`px-3 py-1.5 ${secondaryButton}`}>
          Log out
        </button>
      </div>
    </header>
  );
}
