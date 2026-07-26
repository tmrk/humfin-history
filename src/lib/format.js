// Number formatting shared by the chart, tooltip, stats and ledger table.

// 1234567.89 -> "1,234,568" (or with decimals: "1,234,567.89")
export const formatAmount = (number, decimals = 0) => {
  const value = Number(number);
  if (!Number.isFinite(value) || value === 0) return '0';
  const parts = value.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

// 1500000000 -> "1.5B", 20000000 -> "20M", 3500 -> "3.5k"
export const formatCompact = (value) => {
  const abs = Math.abs(Number(value) || 0);
  const scale = (divisor, suffix) => {
    const scaled = abs / divisor;
    const rounded = scaled >= 10 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
    return rounded + suffix;
  };
  if (abs >= 1e9) return scale(1e9, 'B');
  if (abs >= 1e6) return scale(1e6, 'M');
  if (abs >= 1e3) return scale(1e3, 'k');
  return String(Math.round(abs));
};

// "2004-12-26T00:00:00Z" -> "2004-12-26" (empty string when unparsable)
export const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};
