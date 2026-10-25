import type { FormEvent } from 'react';
import type { SearchFilters } from '../api/vehiclesApi';
import { TextField } from './TextField';

interface SearchFormProps {
  filters: SearchFilters;
  searching: boolean;
  onChange(filters: SearchFilters): void;
  onSearch(): void;
  onClear(): void;
}

export function SearchForm({ filters, searching, onChange, onSearch, onClear }: SearchFormProps) {
  function update(field: keyof SearchFilters) {
    return (value: string) => onChange({ ...filters, [field]: value });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch();
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 border border-line p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
    >
      <TextField id="filter-make" label="Make" value={filters.make} onChange={update('make')} />
      <TextField id="filter-model" label="Model" value={filters.model} onChange={update('model')} />
      <TextField id="filter-category" label="Category" value={filters.category} onChange={update('category')} />
      <TextField
        id="filter-min-price"
        label="Min price"
        type="number"
        min={0}
        inputMode="decimal"
        value={filters.minPrice}
        onChange={update('minPrice')}
      />
      <TextField
        id="filter-max-price"
        label="Max price"
        type="number"
        min={0}
        inputMode="decimal"
        value={filters.maxPrice}
        onChange={update('maxPrice')}
      />
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <button
          type="submit"
          disabled={searching}
          className="flex-1 bg-ink py-2 text-sm font-medium text-canvas disabled:cursor-not-allowed disabled:bg-disabled disabled:text-ink-muted"
        >
          Search
        </button>
        <button type="button" onClick={onClear} className="flex-1 border border-line py-2 text-sm hover:border-ink">
          Clear
        </button>
      </div>
    </form>
  );
}
