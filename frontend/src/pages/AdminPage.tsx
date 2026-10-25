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
import { VehicleListStates } from '../components/VehicleListStates';

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
            <VehicleListStates
              vehicles={vehicles}
              error={error}
              emptyMessage="No vehicles in the inventory yet. Add the first one."
              onRetry={() => void load(EMPTY_FILTERS)}
            >
              {(loaded) => (
                <ul className="space-y-3">
                  {loaded.map((vehicle) => (
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
            </VehicleListStates>
          </section>
        </div>
      </main>
    </div>
  );
}
