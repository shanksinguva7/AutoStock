import { useState, type FormEvent } from 'react';
import type { Vehicle } from '../api/vehiclesApi';
import { parseRestockAmount } from '../admin/vehicleValidation';
import { TextField } from './TextField';
import { primaryButton, secondaryButton } from './styles';

const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

interface AdminVehicleRowProps {
  vehicle: Vehicle;
  onEdit(vehicle: Vehicle): void;
  onDelete(vehicle: Vehicle): Promise<boolean>;
  /** Resolves true when the restock succeeded, so the amount input can reset. */
  onRestock(vehicle: Vehicle, amount: number): Promise<boolean>;
}

export function AdminVehicleRow({ vehicle, onEdit, onDelete, onRestock }: AdminVehicleRowProps) {
  const { id, make, model, category, price, quantity } = vehicle;
  const name = `${make} ${model}`;
  const headingId = `admin-vehicle-${id}-name`;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [restockAmount, setRestockAmount] = useState('');
  const [restockError, setRestockError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    setBusy(true);
    const deleted = await onDelete(vehicle);
    // A deleted row unmounts; only a failed delete needs its controls back.
    if (!deleted) {
      setBusy(false);
      setConfirmingDelete(false);
    }
  }

  async function handleRestock(event: FormEvent) {
    event.preventDefault();
    const parsed = parseRestockAmount(restockAmount);
    if ('error' in parsed) {
      setRestockError(parsed.error);
      return;
    }
    setRestockError(undefined);
    setBusy(true);
    if (await onRestock(vehicle, parsed.amount)) setRestockAmount('');
    setBusy(false);
  }

  return (
    <article aria-labelledby={headingId} className="border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs tracking-[0.2em] text-ink-muted uppercase">{category}</p>
          <h3 id={headingId} className="mt-1 text-base">
            {name}
          </h3>
        </div>
        <div className="text-right text-sm">
          <p>{priceFormat.format(price)}</p>
          <p className={quantity === 0 ? 'text-warning' : 'text-ink-muted'}>{quantity} in stock</p>
        </div>
      </div>

      {confirmingDelete ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border border-error p-3 text-sm">
          <p className="flex-1 text-error">Delete {name}? This cannot be undone.</p>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={busy}
            className="bg-error px-3 py-1.5 font-medium text-canvas disabled:bg-disabled"
          >
            Confirm delete
          </button>
          <button type="button" onClick={() => setConfirmingDelete(false)} className={`px-3 py-1.5 ${secondaryButton}`}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <form onSubmit={handleRestock} noValidate className="flex flex-1 items-end gap-2">
            <div className="flex-1">
              <TextField
                id={`restock-${id}`}
                label="Restock amount"
                inputMode="numeric"
                value={restockAmount}
                onChange={setRestockAmount}
                error={restockError}
              />
            </div>
            <button type="submit" disabled={busy} className={`px-3 py-2 ${primaryButton}`}>
              Restock
            </button>
          </form>
          <div className="flex gap-2">
            <button type="button" onClick={() => onEdit(vehicle)} className={`px-3 py-2 ${secondaryButton}`}>
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="border border-error px-3 py-2 text-sm text-error hover:bg-error hover:text-canvas"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
