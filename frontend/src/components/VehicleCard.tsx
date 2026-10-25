import type { Vehicle } from '../api/vehiclesApi';

const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

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
        <dd className="text-base">{priceFormat.format(price)}</dd>
        <dt className="sr-only">Stock</dt>
        <dd className={outOfStock ? 'text-warning' : 'text-ink-muted'}>{quantity} in stock</dd>
      </dl>
      <button
        type="button"
        onClick={() => onPurchase(vehicle)}
        disabled={outOfStock || purchasing}
        className="mt-5 w-full bg-ink py-2.5 text-sm font-medium text-canvas disabled:cursor-not-allowed disabled:bg-disabled disabled:text-ink-muted"
      >
        {outOfStock ? 'Out of stock' : purchasing ? 'Purchasing…' : 'Purchase'}
      </button>
    </article>
  );
}
