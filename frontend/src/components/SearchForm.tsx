import type { FormEvent } from 'react';
import type { SearchFilters } from '../api/vehiclesApi';
import { TextField } from './TextField';
import { primaryButton, secondaryButton } from './styles';

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
      // Phone: text filters full width, the two prices share a row. Tablet: three per row, so the
      // price range sits together with the buttons. Desktop: everything on one row.
      className="grid grid-cols-2 gap-4 border border-line p-4 sm:grid-cols-3 sm:items-end lg:grid-cols-6"
    >
      <div className="col-span-2 sm:col-span-1">
        <TextField id="filter-make" label="Make" value={filters.make} onChange={update('make')} />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <TextField id="filter-model" label="Model" value={filters.model} onChange={update('model')} />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <TextField id="filter-category" label="Category" value={filters.category} onChange={update('category')} />
      </div>
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
      <div className="col-span-2 flex gap-2 sm:col-span-1">
        <button
          type="submit"
          disabled={searching}
          className={`flex-1 py-2 ${primaryButton}`}
        >
          Search
        </button>
        <button type="button" onClick={onClear} className={`flex-1 py-2 ${secondaryButton}`}>
          Clear
        </button>
      </div>
    </form>
  );
}
