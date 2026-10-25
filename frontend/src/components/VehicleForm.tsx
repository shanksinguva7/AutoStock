import { useState, type FormEvent } from 'react';
import type { Vehicle, VehicleInput } from '../api/vehiclesApi';
import {
  EMPTY_VEHICLE_FORM,
  toFormValues,
  validateVehicleForm,
  type VehicleFormErrors,
  type VehicleFormValues,
} from '../admin/vehicleValidation';
import { TextField } from './TextField';
import { primaryButton, secondaryButton } from './styles';

interface VehicleFormProps {
  /** The vehicle being edited, or null to add a new one. Remount (via `key`) when it changes. */
  editing: Vehicle | null;
  /** Resolves true when the save succeeded, so the add form can reset. */
  onSubmit(data: VehicleInput): Promise<boolean>;
  onCancelEdit(): void;
}

export function VehicleForm({ editing, onSubmit, onCancelEdit }: VehicleFormProps) {
  const [values, setValues] = useState<VehicleFormValues>(editing ? toFormValues(editing) : EMPTY_VEHICLE_FORM);
  const [errors, setErrors] = useState<VehicleFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof VehicleFormValues) {
    return (value: string) => setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { errors: validationErrors, data } = validateVehicleForm(values);
    setErrors(validationErrors);
    if (!data) return;

    setSubmitting(true);
    const saved = await onSubmit(data);
    setSubmitting(false);
    if (saved && !editing) setValues(EMPTY_VEHICLE_FORM);
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="vehicle-form-title" className="space-y-4 border border-line p-4">
      <h2 id="vehicle-form-title" className="text-xs tracking-[0.25em] text-ink-muted uppercase">
        {editing ? `Edit ${editing.make} ${editing.model}` : 'Add vehicle'}
      </h2>
      <TextField id="vehicle-make" label="Make" value={values.make} onChange={update('make')} error={errors.make} />
      <TextField id="vehicle-model" label="Model" value={values.model} onChange={update('model')} error={errors.model} />
      <TextField
        id="vehicle-category"
        label="Category"
        value={values.category}
        onChange={update('category')}
        error={errors.category}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          id="vehicle-price"
          label="Price"
          inputMode="decimal"
          value={values.price}
          onChange={update('price')}
          error={errors.price}
        />
        <TextField
          id="vehicle-quantity"
          label="Quantity"
          inputMode="numeric"
          value={values.quantity}
          onChange={update('quantity')}
          error={errors.quantity}
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className={`flex-1 py-2.5 ${primaryButton}`}>
          {editing ? 'Save changes' : 'Add vehicle'}
        </button>
        {editing && (
          <button type="button" onClick={onCancelEdit} className={`flex-1 py-2.5 ${secondaryButton}`}>
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
}
