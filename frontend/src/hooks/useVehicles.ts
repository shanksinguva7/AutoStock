import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';
import { EMPTY_FILTERS, fetchVehicles, type SearchFilters, type Vehicle } from '../api/vehiclesApi';

/**
 * Loads the vehicle list on mount and on demand. `vehicles` stays null until the first
 * successful load, so callers can tell "still loading" from "loaded, but empty".
 */
export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only the newest request may update state, so a slow older response cannot overwrite it.
  const latestRequest = useRef(0);

  const load = useCallback(async (filters: SearchFilters) => {
    const requestId = ++latestRequest.current;
    const isLatest = () => requestId === latestRequest.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchVehicles(filters);
      if (isLatest()) setVehicles(result);
    } catch (loadError) {
      if (isLatest()) setError(errorMessage(loadError));
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(EMPTY_FILTERS);
  }, [load]);

  return { vehicles, loading, error, load };
}
