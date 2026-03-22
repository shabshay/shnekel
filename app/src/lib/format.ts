/**
 * Format a number as ₪ currency with thousands separators.
 * formatCurrency(1200)    → "₪1,200"
 * formatCurrency(1200.5)  → "₪1,200.50"
 * formatCurrency(-50)     → "-₪50"
 */
export function formatCurrency(amount: number, decimals: boolean = false): string {
  const abs = Math.abs(amount);
  const formatted = decimals
    ? abs.toLocaleString('en-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : abs.toLocaleString('en-IL', { maximumFractionDigits: 0 });
  const prefix = amount < 0 ? '-₪' : '₪';
  return `${prefix}${formatted}`;
}
