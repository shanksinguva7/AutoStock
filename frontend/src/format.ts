const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formats a vehicle price for display, e.g. 22000 -> "$22,000". */
export function formatPrice(price: number): string {
  return priceFormat.format(price);
}
