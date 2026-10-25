import type { Vehicle, VehicleInput } from '../api/vehiclesApi';

/** Raw form values; numbers stay strings until validation so bad input can be reported. */
export interface VehicleFormValues {
  make: string;
  model: string;
  category: string;
  price: string;
  quantity: string;
}

export type VehicleFormErrors = Partial<Record<keyof VehicleFormValues, string>>;

export const EMPTY_VEHICLE_FORM: VehicleFormValues = { make: '', model: '', category: '', price: '', quantity: '' };

const RESTOCK_AMOUNT_ERROR = 'Restock amount must be a whole number above 0';

// Number('') is 0, so blank input must be caught before converting.
function toNumber(raw: string): number {
  return raw.trim() === '' ? Number.NaN : Number(raw.trim());
}

export function toFormValues({ make, model, category, price, quantity }: Vehicle): VehicleFormValues {
  return { make, model, category, price: String(price), quantity: String(quantity) };
}

/**
 * Applies the same rules as the backend (text required, price >= 0, quantity a whole number >= 0).
 * Returns the errors, plus the parsed vehicle when there are none.
 */
export function validateVehicleForm(values: VehicleFormValues): { errors: VehicleFormErrors; data?: VehicleInput } {
  const errors: VehicleFormErrors = {};
  if (!values.make.trim()) errors.make = 'Enter a make';
  if (!values.model.trim()) errors.model = 'Enter a model';
  if (!values.category.trim()) errors.category = 'Enter a category';

  const price = toNumber(values.price);
  if (!values.price.trim()) errors.price = 'Enter a price';
  else if (!Number.isFinite(price) || price < 0) errors.price = 'Price must be a number of 0 or more';

  const quantity = toNumber(values.quantity);
  if (!values.quantity.trim()) errors.quantity = 'Enter a quantity';
  else if (!Number.isInteger(quantity) || quantity < 0) {
    errors.quantity = 'Quantity must be a whole number of 0 or more';
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }
  return {
    errors,
    data: {
      make: values.make.trim(),
      model: values.model.trim(),
      category: values.category.trim(),
      price,
      quantity,
    },
  };
}

/** Returns the amount as a number, or an error message when it is not a positive whole number. */
export function parseRestockAmount(raw: string): { amount: number } | { error: string } {
  const amount = toNumber(raw);
  return Number.isInteger(amount) && amount > 0 ? { amount } : { error: RESTOCK_AMOUNT_ERROR };
}
