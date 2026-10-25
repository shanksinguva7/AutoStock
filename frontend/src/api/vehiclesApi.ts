import { apiRequest } from './client';

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

/** Search form values. Kept as strings because they come straight from inputs; blank means "any". */
export interface SearchFilters {
  make: string;
  model: string;
  category: string;
  minPrice: string;
  maxPrice: string;
}

export const EMPTY_FILTERS: SearchFilters = { make: '', model: '', category: '', minPrice: '', maxPrice: '' };

/** Builds a query string from the filled filters only, so blank inputs never filter. */
function toQueryString(filters: SearchFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value.trim()) params.append(key, value.trim());
  }
  return params.toString();
}

/** Lists every vehicle, or searches when at least one filter is filled. */
export function fetchVehicles(filters: SearchFilters): Promise<Vehicle[]> {
  const query = toQueryString(filters);
  return apiRequest<Vehicle[]>(query ? `/api/vehicles/search?${query}` : '/api/vehicles');
}

/** Buys one unit; the backend answers 409 when the vehicle is out of stock. */
export function purchaseVehicle(id: number): Promise<Vehicle> {
  return apiRequest<Vehicle>(`/api/vehicles/${id}/purchase`, { method: 'POST' });
}
