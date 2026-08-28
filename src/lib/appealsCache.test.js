import { describe, expect, it } from 'vitest';
import {
  APPEALS_CACHE_KEY,
  APPEALS_CACHE_TTL_MS,
  minimiseAppeal,
  readCachedAppeals,
  writeCachedAppeals,
} from './appealsCache';

const createStorage = () => {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
};

const appeal = {
  id: '42',
  aid: '9001',
  code: 'MDRXX042',
  name: 'Example floods',
  atype_display: 'DREF',
  start_date: '2024-01-02T00:00:00Z',
  amount_requested: 1000,
  amount_funded: 800,
  modified_at: '2024-02-01T00:00:00Z',
  country: { id: 7, iso3: 'XXX', name: 'Example' },
  unused_large_field: 'not cached',
};

describe('appeal cache', () => {
  it('keeps only fields used by the app', () => {
    expect(minimiseAppeal(appeal)).toEqual({
      id: '42',
      aid: '9001',
      code: 'MDRXX042',
      name: 'Example floods',
      atype_display: 'DREF',
      start_date: '2024-01-02T00:00:00Z',
      amount_requested: 1000,
      amount_funded: 800,
      modified_at: '2024-02-01T00:00:00Z',
      country: { name: 'Example' },
    });
  });

  it('round-trips fresh appeal data', () => {
    const storage = createStorage();
    expect(writeCachedAppeals([appeal], storage, 1000)).toBe(true);
    expect(readCachedAppeals(storage, 1000 + APPEALS_CACHE_TTL_MS - 1)).toEqual([
      minimiseAppeal(appeal),
    ]);
  });

  it('removes expired entries', () => {
    const storage = createStorage();
    writeCachedAppeals([appeal], storage, 1000);
    expect(readCachedAppeals(storage, 1000 + APPEALS_CACHE_TTL_MS)).toBeNull();
    expect(storage.getItem(APPEALS_CACHE_KEY)).toBeNull();
  });

  it('recovers from invalid data and unavailable storage', () => {
    const storage = createStorage();
    storage.setItem(APPEALS_CACHE_KEY, '{not json');
    expect(readCachedAppeals(storage, 1000)).toBeNull();

    const unavailable = {
      getItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readCachedAppeals(unavailable, 1000)).toBeNull();
    expect(writeCachedAppeals([appeal], null, 1000)).toBe(false);
  });
});
