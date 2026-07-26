import { describe, it, expect } from 'vitest';
import { formatAmount, formatCompact, formatDate } from './format';

describe('formatAmount', () => {
  it('inserts thousands separators', () => {
    expect(formatAmount(1234567)).toBe('1,234,567');
    expect(formatAmount(999)).toBe('999');
  });

  it('keeps requested decimals', () => {
    expect(formatAmount(1234567.891, 2)).toBe('1,234,567.89');
  });

  it('returns "0" for zero, null, undefined and NaN', () => {
    expect(formatAmount(0)).toBe('0');
    expect(formatAmount(null)).toBe('0');
    expect(formatAmount(undefined)).toBe('0');
    expect(formatAmount('not a number')).toBe('0');
  });

  it('handles numeric strings (API returned strings in 2023)', () => {
    expect(formatAmount('217260.00')).toBe('217,260');
  });
});

describe('formatCompact', () => {
  it('scales billions, millions and thousands', () => {
    expect(formatCompact(1500000000)).toBe('1.5B');
    expect(formatCompact(20000000)).toBe('20M');
    expect(formatCompact(3500)).toBe('3.5k');
  });

  it('rounds to one decimal under 10 and none above', () => {
    expect(formatCompact(671000000)).toBe('671M');
    expect(formatCompact(6530000000)).toBe('6.5B');
  });

  it('passes small values through', () => {
    expect(formatCompact(815)).toBe('815');
    expect(formatCompact(0)).toBe('0');
  });
});

describe('formatDate', () => {
  it('formats ISO timestamps as dates', () => {
    expect(formatDate('2004-12-26T00:00:00Z')).toBe('2004-12-26');
  });

  it('returns an empty string for invalid input', () => {
    expect(formatDate('never')).toBe('');
    expect(formatDate(null)).toBe('');
  });
});
