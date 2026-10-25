import { useState } from 'react';
import { errorMessage } from '../api/client';
import { EMPTY_FILTERS, purchaseVehicle, type SearchFilters, type Vehicle } from '../api/vehiclesApi';
import { useVehicles } from '../hooks/useVehicles';
import { useToast } from '../components/Toast';
import { AppHeader } from '../components/AppHeader';
import { SearchForm } from '../components/SearchForm';
import { VehicleCard } from '../components/VehicleCard';
import { secondaryButton } from '../components/styles';

function hasFilters(filters: SearchFilters): boolean {
  return Object.values(filters).some((value) => value.trim() !== '');
}

export function DashboardPage() {
  const showToast = useToast();
  const { vehicles, loading, error, load } = useVehicles();
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  // The filters of the last search, reused when the list refreshes after a purchase.
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);

  function applyFilters(next: SearchFilters) {
    setAppliedFilters(next);
    void load(next);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    applyFilters(EMPTY_FILTERS);
  }

  async function purchase(vehicle: Vehicle) {
    setPurchasingId(vehicle.id);
    try {
      await purchaseVehicle(vehicle.id);
      showToast('success', `Purchased ${vehicle.make} ${vehicle.model}`);
    } catch (purchaseError) {
      showToast('error', errorMessage(purchaseError));
    } finally {
      setPurchasingId(null);
    }
    // Refresh either way: a 409 means the stock changed since the list was loaded.
    await load(appliedFilters);
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="px-4 py-8 sm:px-8">
        <h1 className="mb-6 text-sm tracking-[0.25em] uppercase">Dashboard</h1>
        <SearchForm
          filters={filters}
          searching={loading}
          onChange={setFilters}
          onSearch={() => applyFilters(filters)}
          onClear={clearFilters}
        />
        <section aria-busy={loading} className="mt-8">
          {error ? (
            <div role="alert" className="border border-error p-5 text-sm">
              <p className="text-error">Could not load vehicles: {error}</p>
              <button
                type="button"
                onClick={() => void load(appliedFilters)}
                className={`mt-4 px-3 py-1.5 ${secondaryButton}`}
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
