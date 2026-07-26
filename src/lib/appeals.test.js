import { describe, it, expect } from 'vitest';
import {
  dedupeAppeals,
  aggregateByYear,
  adjustRowsForInflation,
  FIRST_YEAR_WITH_FUNDING_DATA,
} from './appeals';
import { adjustForInflation } from './inflation';

const appeal = (overrides) => ({
  id: '1',
  aid: '100',
  code: 'MDRXX001',
  start_date: '2020-05-01T00:00:00Z',
  amount_requested: 1000,
  amount_funded: 600,
  modified_at: '2024-01-01 00:00:00+00:00',
  ...overrides,
});

describe('dedupeAppeals', () => {
  it('keeps a single record per id', () => {
    const result = dedupeAppeals([appeal(), appeal(), appeal({ id: '2' })]);
    expect(result).toHaveLength(2);
  });

  it('keeps the most recently modified duplicate', () => {
    const older = appeal({ amount_funded: 100, modified_at: '2024-01-01 00:00:00+00:00' });
    const newer = appeal({ amount_funded: 900, modified_at: '2025-06-01 00:00:00+00:00' });
    expect(dedupeAppeals([newer, older])[0].amount_funded).toBe(900);
    expect(dedupeAppeals([older, newer])[0].amount_funded).toBe(900);
  });
});

describe('aggregateByYear', () => {
  it('returns an empty array for no appeals', () => {
    expect(aggregateByYear([])).toEqual([]);
  });

  it('sums amounts per start year', () => {
    const rows = aggregateByYear([
      appeal({ id: '1', amount_requested: 1000, amount_funded: 600 }),
      appeal({ id: '2', amount_requested: 500, amount_funded: 200 }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].year).toBe(2020);
    expect(rows[0].amountRequested).toBe(1500);
    expect(rows[0].amountFunded).toBe(800);
    expect(rows[0].appeals).toHaveLength(2);
  });

  it('fills years without appeals with zero rows', () => {
    const rows = aggregateByYear([
      appeal({ id: '1', start_date: '2018-01-01T00:00:00Z' }),
      appeal({ id: '2', start_date: '2020-06-01T00:00:00Z' }),
    ]);
    expect(rows.map(row => row.year)).toEqual([2018, 2019, 2020]);
    expect(rows[1].amountRequested).toBe(0);
    expect(rows[1].appeals).toHaveLength(0);
  });

  it('uses the requested amount as funded before 1994, the funded amount from 1994 on', () => {
    const cutoff = FIRST_YEAR_WITH_FUNDING_DATA;
    const rows = aggregateByYear([
      appeal({ id: '1', start_date: `${cutoff - 1}-06-01T00:00:00Z`, amount_requested: 1000, amount_funded: 0 }),
      appeal({ id: '2', start_date: `${cutoff}-06-01T00:00:00Z`, amount_requested: 1000, amount_funded: 700 }),
    ]);
    expect(rows[0].amountFundedAndRequestedPre1994).toBe(1000);
    expect(rows[1].amountFundedAndRequestedPre1994).toBe(700);
  });

  it('accepts string amounts as returned by older API snapshots', () => {
    const rows = aggregateByYear([
      appeal({ amount_requested: '217260.00', amount_funded: '150021.50' }),
    ]);
    expect(rows[0].amountRequested).toBe(217260);
    expect(rows[0].amountFunded).toBe(150021.5);
  });

  it('treats missing amounts as zero', () => {
    const rows = aggregateByYear([
      appeal({ amount_requested: null, amount_funded: undefined }),
    ]);
    expect(rows[0].amountRequested).toBe(0);
    expect(rows[0].amountFunded).toBe(0);
  });
});

describe('adjustRowsForInflation', () => {
  it('adjusts every series of every row', () => {
    const rows = aggregateByYear([
      appeal({ start_date: '1990-06-01T00:00:00Z', amount_requested: 1000, amount_funded: 0 }),
    ]);
    const adjusted = adjustRowsForInflation(rows);
    expect(adjusted[0].amountRequested).toBeCloseTo(adjustForInflation(1000, 1990), 6);
    expect(adjusted[0].amountRequested).toBeGreaterThan(1000);
    expect(adjusted[0].amountFunded).toBe(0);
  });

  it('does not mutate the input rows', () => {
    const rows = aggregateByYear([appeal({ start_date: '1990-06-01T00:00:00Z' })]);
    const before = rows[0].amountRequested;
    adjustRowsForInflation(rows);
    expect(rows[0].amountRequested).toBe(before);
  });
});
