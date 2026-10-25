import type { ReactNode } from 'react';
import type { Vehicle } from '../api/vehiclesApi';
import { secondaryButton } from './styles';

interface VehicleListStatesProps {
  vehicles: Vehicle[] | null;
  error: string | null;
  emptyMessage: string;
  onRetry(): void;
  /** Renders the list once there is at least one vehicle. */
  children(vehicles: Vehicle[]): ReactNode;
}

/** The error, loading and empty states shared by every vehicle list, then the list itself. */
export function VehicleListStates({ vehicles, error, emptyMessage, onRetry, children }: VehicleListStatesProps) {
  if (error) {
    return (
      <div role="alert" className="border border-error p-5 text-sm">
        <p className="text-error">Could not load vehicles: {error}</p>
        <button type="button" onClick={onRetry} className={`mt-4 px-3 py-1.5 ${secondaryButton}`}>
          Try again
        </button>
      </div>
    );
  }
  if (vehicles === null) {
    return <p className="text-ink-muted">Loading vehicles…</p>;
  }
  if (vehicles.length === 0) {
    return <p className="text-ink-muted">{emptyMessage}</p>;
  }
  return <>{children(vehicles)}</>;
}
