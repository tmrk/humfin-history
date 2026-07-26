import { adjustForInflation } from './inflation';

export const APPEALS_API_URL = 'https://goadmin.ifrc.org/api/v2/appeal/?limit=10000';

// GO has no funding records before 1994: every appeal that started earlier has
// amount_funded = 0, so for those years the requested amount is the only
// available proxy for actual spending.
export const FIRST_YEAR_WITH_FUNDING_DATA = 1994;

// The API occasionally returns the same appeal twice (same id, different
// funding snapshots); keep only the most recently modified record.
export const dedupeAppeals = (appeals) => {
  const byId = new Map();
  for (const appeal of appeals) {
    const existing = byId.get(appeal.id);
    if (!existing || String(appeal.modified_at) > String(existing.modified_at)) {
      byId.set(appeal.id, appeal);
    }
  }
  return [...byId.values()];
};

const startYear = (appeal) => new Date(appeal.start_date).getFullYear();

// Sum appeal amounts per calendar year of the appeal start date. Years without
// any appeal get a zero row so the chart has a continuous x axis.
export const aggregateByYear = (appeals) => {
  if (!appeals.length) return [];
  const years = appeals.map(startYear);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);

  const rows = Array.from({ length: lastYear - firstYear + 1 }, (v, k) => ({
    year: firstYear + k,
    amountFunded: 0,
    amountFundedAndRequestedPre1994: 0,
    amountRequested: 0,
    appeals: [],
  }));

  for (const appeal of appeals) {
    const year = startYear(appeal);
    const row = rows[year - firstYear];
    const funded = Number(appeal.amount_funded) || 0;
    const requested = Number(appeal.amount_requested) || 0;
    row.amountFunded += funded;
    row.amountRequested += requested;
    row.amountFundedAndRequestedPre1994 +=
      year < FIRST_YEAR_WITH_FUNDING_DATA ? requested : funded;
    row.appeals.push(appeal);
  }
  return rows;
};

export const adjustRowsForInflation = (rows, targetYear) =>
  rows.map(row => ({
    ...row,
    amountFunded: adjustForInflation(row.amountFunded, row.year, targetYear),
    amountFundedAndRequestedPre1994: adjustForInflation(row.amountFundedAndRequestedPre1994, row.year, targetYear),
    amountRequested: adjustForInflation(row.amountRequested, row.year, targetYear),
  }));
