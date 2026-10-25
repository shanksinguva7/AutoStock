import type { Vehicle } from '../api/vehiclesApi';
import { formatPrice } from '../format';
import { primaryButton } from './styles';

interface VehicleCardProps {
  vehicle: Vehicle;
  purchasing: boolean;
  onPurchase(vehicle: Vehicle): void;
}

export function VehicleCard({ vehicle, purchasing, onPurchase }: VehicleCardProps) {
  const { id, make, model, category, price, quantity } = vehicle;
  const headingId = `vehicle-${id}-name`;
  const outOfStock = quantity === 0;

  return (
    <article aria-labelledby={headingId} className="flex flex-col border border-line bg-surface p-5">
      <p className="text-xs tracking-[0.2em] text-ink-muted uppercase">{category}</p>
      <h2 id={headingId} className="mt-2 text-lg">
        {make} {model}
      </h2>
      <dl className="mt-4 flex items-baseline justify-between text-sm">
        <dt className="sr-only">Price</dt>
        <dd className="text-base">{formatPrice(price)}</dd>
        <dt className="sr-only">Stock</dt>
        <dd className={outOfStock ? 'text-warning' : 'text-ink-muted'}>{quantity} in stock</dd>
      </dl>
      <button
        type="button"
        onClick={() => onPurchase(vehicle)}
        disabled={outOfStock || purchasing}
        className={`mt-5 w-full py-2.5 ${primaryButton}`}
      >
        {outOfStock ? 'Out of stock' : purchasing ? 'Purchasing…' : 'Purchase'}
      </button>
    </article>
  );
}
