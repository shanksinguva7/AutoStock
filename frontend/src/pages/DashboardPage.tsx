import { useAuth } from '../auth/AuthContext';

/** Placeholder until the vehicle dashboard slice; shows who is signed in. */
export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-8">
        <span className="text-sm tracking-[0.4em] uppercase">AutoStock</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-ink-muted">{user?.email}</span>
          <button type="button" onClick={logout} className="border border-line px-3 py-1.5 hover:border-ink">
            Log out
          </button>
        </div>
      </header>
      <main className="px-4 py-10 sm:px-8">
        <h1 className="text-sm tracking-[0.25em] uppercase">Dashboard</h1>
        <p className="mt-4 text-ink-muted">Vehicle inventory is coming next.</p>
      </main>
    </div>
  );
}
