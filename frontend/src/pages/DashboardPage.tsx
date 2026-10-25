import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { EMPTY_FILTERS, fetchVehicles, purchaseVehicle, type SearchFilters, type Vehicle } from '../api/vehiclesApi';
import { useToast } from '../components/Toast';
import { SearchForm } from '../components/SearchForm';
import { VehicleCard } from '../components/VehicleCard';

const UNEXPECTED_ERROR = 'Something went wrong. Please try again.';

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : UNEXPECTED_ERROR;
}

function hasFilters(filters: SearchFilters): boolean {
  return Object.values(filters).some((value) => value.trim() !== '');
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const showToast = useToast();
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  // The filters of the last search, reused when the list refreshes after a purchase.
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  // null until the first successful load, so the page can tell "loading" from "empty".
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  // Only the newest request may update the page, so a slow older response cannot overwrite it.
  const latestRequest = useRef(0);

  const loadVehicles = useCallback(async (searchFilters: SearchFilters) => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchVehicles(searchFilters);
      if (requestId === latestRequest.current) setVehicles(result);
    } catch (loadError) {
      if (requestId === latestRequest.current) setError(messageOf(loadError));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles(EMPTY_FILTERS);
  }, [loadVehicles]);

  function search() {
    setAppliedFilters(filters);
    void loadVehicles(filters);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    void loadVehicles(EMPTY_FILTERS);
  }

  async function purchase(vehicle: Vehicle) {
    setPurchasingId(vehicle.id);
    try {
      await purchaseVehicle(vehicle.id);
      showToast('success', `Purchased ${vehicle.make} ${vehicle.model}`);
    } catch (purchaseError) {
      showToast('error', messageOf(purchaseError));
    } finally {
      setPurchasingId(null);
    }
    // Refresh either way: a 409 means the stock changed since the list was loaded.
    await loadVehicles(appliedFilters);
  }

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
      <main className="px-4 py-8 sm:px-8">
        <h1 className="mb-6 text-sm tracking-[0.25em] uppercase">Dashboard</h1>
        <SearchForm
          filters={filters}
          searching={loading}
          onChange={setFilters}
          onSearch={search}
          onClear={clearFilters}
        />
        <section aria-busy={loading} className="mt-8">
          {error ? (
            <div role="alert" className="border border-error p-5 text-sm">
              <p className="text-error">Could not load vehicles: {error}</p>
              <button
                type="button"
                onClick={() => void loadVehicles(appliedFilters)}
                className="mt-4 border border-line px-3 py-1.5 text-ink hover:border-ink"
              >
                Try again
              </button>
            </div>
          ) : vehicles === null ? (
            <p className="text-ink-muted">Loading vehicles…</p>
          ) : vehicles.length === 0 ? (
            <p className="text-ink-muted">
              {hasFilters(appliedFilters) ? 'No vehicles match your filters.' : 'No vehicles in the inventory yet.'}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id}>
                  <VehicleCard
                    vehicle={vehicle}
                    purchasing={purchasingId === vehicle.id}
                    onPurchase={(v) => void purchase(v)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
