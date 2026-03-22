import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../format';

describe('formatCurrency', () => {
  it('formats whole numbers with thousands separator', () => {
    expect(formatCurrency(1200)).toBe('₪1,200');
    expect(formatCurrency(999)).toBe('₪999');
    expect(formatCurrency(10000)).toBe('₪10,000');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('₪0');
  });

  it('formats negative numbers with minus prefix', () => {
    expect(formatCurrency(-50)).toBe('-₪50');
    expect(formatCurrency(-1200)).toBe('-₪1,200');
  });

  it('formats with decimals when requested', () => {
    expect(formatCurrency(1200.5, true)).toBe('₪1,200.50');
    expect(formatCurrency(350, true)).toBe('₪350.00');
    expect(formatCurrency(0, true)).toBe('₪0.00');
  });

  it('rounds to whole number by default', () => {
    expect(formatCurrency(1200.75)).toBe('₪1,201');
    expect(formatCurrency(99.4)).toBe('₪99');
  });
});
