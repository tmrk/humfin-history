export const APPEALS_CACHE_KEY = 'humfin-history:appeals:v1';
export const APPEALS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const getBrowserStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

export const minimiseAppeal = (appeal) => ({
  id: appeal.id,
  aid: appeal.aid,
  code: appeal.code,
  name: appeal.name,
  atype_display: appeal.atype_display,
  start_date: appeal.start_date,
  amount_requested: appeal.amount_requested,
  amount_funded: appeal.amount_funded,
  modified_at: appeal.modified_at,
  country: appeal.country ? { name: appeal.country.name } : null,
});

export const readCachedAppeals = (storage = getBrowserStorage(), now = Date.now()) => {
  if (!storage) return null;

  try {
    const stored = storage.getItem(APPEALS_CACHE_KEY);
    if (!stored) return null;

    const cache = JSON.parse(stored);
    const isFresh =
      Number.isFinite(cache.cachedAt) &&
      now >= cache.cachedAt &&
      now - cache.cachedAt < APPEALS_CACHE_TTL_MS;

    if (!isFresh || !Array.isArray(cache.appeals)) {
      storage.removeItem(APPEALS_CACHE_KEY);
      return null;
    }

    return cache.appeals;
  } catch {
    try {
      storage.removeItem(APPEALS_CACHE_KEY);
    } catch {
      // Storage may be unavailable in private or restricted browser contexts.
    }
    return null;
  }
};

export const writeCachedAppeals = (appeals, storage = getBrowserStorage(), now = Date.now()) => {
  if (!storage) return false;

  try {
    storage.setItem(
      APPEALS_CACHE_KEY,
      JSON.stringify({
        cachedAt: now,
        appeals: appeals.map(minimiseAppeal),
      })
    );
    return true;
  } catch {
    return false;
  }
};
