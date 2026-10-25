import { useState } from 'react';
import { errorMessage } from '../api/client';
import {
  EMPTY_FILTERS,
  createVehicle,
  deleteVehicle,
  restockVehicle,
  updateVehicle,
  type Vehicle,
  type VehicleInput,
} from '../api/vehiclesApi';
import { useVehicles } from '../hooks/useVehicles';
import { useToast } from '../components/Toast';
import { AppHeader } from '../components/AppHeader';
import { VehicleForm } from '../components/VehicleForm';
import { AdminVehicleRow } from '../components/AdminVehicleRow';
import { secondaryButton } from '../components/styles';

export function AdminPage() {
  const showToast = useToast();
  const { vehicles, loading, error, load } = useVehicles();
  const [editing, setEditing] = useState<Vehicle | null>(null);

  /** Runs one admin change, reports it in a toast and reloads the list when it worked. */
  async function runChange(change: () => Promise<unknown>, successMessage: string): Promise<boolean> {
    try {
      await change();
    } catch (changeError) {
      showToast('error', errorMessage(changeError));
      return false;
    }
    showToast('success', successMessage);
    await load(EMPTY_FILTERS);
    return true;
  }

  async function saveVehicle(data: VehicleInput): Promise<boolean> {
    const name = `${data.make} ${data.model}`;
    if (!editing) {
      return runChange(() => createVehicle(data), `Added ${name}`);
    }
    const saved = await runChange(() => updateVehicle(editing.id, data), `Updated ${name}`);
    if (saved) setEditing(null);
    return saved;
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="px-4 py-8 sm:px-8">
        <h1 className="mb-6 text-sm tracking-[0.25em] uppercase">Manage inventory</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[22rem_1fr] lg:items-start">
          <div className="lg:sticky lg:top-6">
            <VehicleForm
              key={editing?.id ?? 'new'}
              editing={editing}
              onSubmit={saveVehicle}
              onCancelEdit={() => setEditing(null)}
            />
          </div>
          <section aria-busy={loading} aria-label="Vehicles">
            {error ? (
              <div role="alert" className="border border-error p-5 text-sm">
                <p className="text-error">Could not load vehicles: {error}</p>
                <button
                  type="button"
                  onClick={() => void load(EMPTY_FILTERS)}
                  className={`mt-4 px-3 py-1.5 ${secondaryButton}`}
                >
                  Try again
                </button>
              </div>
            ) : vehicles === null ? (
              <p className="text-ink-muted">Loading vehicles…</p>
            ) : vehicles.length === 0 ? (
              <p className="text-ink-muted">No vehicles in the inventory yet. Add the first one.</p>
            ) : (
              <ul className="space-y-3">
                {vehicles.map((vehicle) => (
                  <li key={vehicle.id}>
                    <AdminVehicleRow
                      vehicle={vehicle}
                      onEdit={setEditing}
                      onDelete={(v) => runChange(() => deleteVehicle(v.id), `Deleted ${v.make} ${v.model}`)}
                      onRestock={(v, amount) =>
                        runChange(() => restockVehicle(v.id, amount), `Restocked ${v.make} ${v.model}`)
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
