import { useAuth } from '../auth/AuthContext';
import { secondaryButton } from './styles';

/** Top bar for signed-in pages: app name, the current user's email and log out. */
export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-8">
      <span className="text-sm tracking-[0.4em] uppercase">AutoStock</span>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-ink-muted">{user?.email}</span>
        <button type="button" onClick={logout} className={`px-3 py-1.5 ${secondaryButton}`}>
          Log out
        </button>
      </div>
    </header>
  );
}
