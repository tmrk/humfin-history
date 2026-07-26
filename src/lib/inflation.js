import CPIdata from '../cached/CPIdata.json';

// Swiss CPI annual averages on every original base series (1914-06-01 ... 2020-12-01),
// as published by the Federal Statistical Office (asset cc-d-05.02.08).
// Regenerate src/cached/CPIdata.json with `npm run update-cpi`.

export const firstYearInCPIdata = Math.min(...CPIdata.map(entry => entry.year));
export const lastYearInCPIdata = Math.max(...CPIdata.map(entry => entry.year));

const entriesByYear = new Map(CPIdata.map(entry => [entry.year, entry]));

// The most recent base series that already existed in a given year, e.g. the
// 1940 row is indexed on both 1914-06-01 and 1939-08-01, so 1939-08-01 wins.
export const latestBaseKey = (entry) =>
  Object.keys(entry)
    .filter(key => key !== 'year')
    .reduce((a, b) => (new Date(a) > new Date(b) ? a : b));

// Convert an amount of a given year into the francs of the target year
// (defaults to the most recent year covered by the CPI data). Amounts from
// years outside the CPI coverage are returned unchanged.
export const adjustForInflation = (amount, baseYear, targetYear = lastYearInCPIdata) => {
  baseYear = Number(baseYear);
  targetYear = Number(targetYear);
  if (baseYear >= targetYear) return amount;
  const baseEntry = entriesByYear.get(baseYear);
  const targetEntry = entriesByYear.get(targetYear);
  if (!baseEntry || !targetEntry) return amount;
  const key = latestBaseKey(baseEntry);
  if (!targetEntry[key]) return amount;
  return amount / baseEntry[key] * targetEntry[key];
};
