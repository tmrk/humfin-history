import { describe, it, expect } from 'vitest';
import CPIdata from '../cached/CPIdata.json';
import {
  adjustForInflation,
  latestBaseKey,
  firstYearInCPIdata,
  lastYearInCPIdata,
} from './inflation';

describe('CPIdata', () => {
  it('starts in 1914 (first Swiss CPI base)', () => {
    expect(firstYearInCPIdata).toBe(1914);
  });

  it('covers a contiguous range of years', () => {
    const years = CPIdata.map(entry => entry.year);
    years.forEach((year, i) => {
      if (i > 0) expect(year).toBe(years[i - 1] + 1);
    });
  });

  it('has the 1914-06-01 base series in every year', () => {
    for (const entry of CPIdata) {
      expect(entry['1914-06-01'], `year ${entry.year}`).toBeTypeOf('number');
    }
  });

  it('anchors each base series at 100 in its base year', () => {
    // e.g. the 2015-12-01 series first appears in 2016 close to 100
    const start2015 = CPIdata.find(entry => entry['2015-12-01'] !== undefined);
    expect(start2015.year).toBe(2016);
    expect(start2015['2015-12-01']).toBeGreaterThan(95);
    expect(start2015['2015-12-01']).toBeLessThan(105);
  });
});

describe('latestBaseKey', () => {
  it('picks the most recent base series available in the entry', () => {
    expect(latestBaseKey({ year: 1919, '1914-06-01': 222 })).toBe('1914-06-01');
    expect(latestBaseKey({ year: 1940, '1914-06-01': 150.8, '1939-08-01': 110 })).toBe('1939-08-01');
  });
});

describe('adjustForInflation', () => {
  const entry = (year) => CPIdata.find(e => e.year === year);

  it('scales a 1919 amount by the 1914 base series ratio', () => {
    const expected = 100 / entry(1919)['1914-06-01'] * entry(lastYearInCPIdata)['1914-06-01'];
    expect(adjustForInflation(100, 1919)).toBeCloseTo(expected, 6);
  });

  it('adjusts to an explicit target year', () => {
    const expected = 100 / entry(1919)['1914-06-01'] * entry(2000)['1914-06-01'];
    expect(adjustForInflation(100, 1919, 2000)).toBeCloseTo(expected, 6);
  });

  it('uses the newest base series that existed in the base year', () => {
    const expected = 100 / entry(1995)['1993-05-01'] * entry(lastYearInCPIdata)['1993-05-01'];
    expect(adjustForInflation(100, 1995)).toBeCloseTo(expected, 6);
  });

  it('multiplies 1919 amounts roughly fivefold by the 2020s', () => {
    const factor = adjustForInflation(1, 1919);
    expect(factor).toBeGreaterThan(4);
    expect(factor).toBeLessThan(6);
  });

  it('returns the amount unchanged when the base year is not before the target', () => {
    expect(adjustForInflation(500, lastYearInCPIdata)).toBe(500);
    expect(adjustForInflation(500, 2030, 2020)).toBe(500);
  });

  it('returns the amount unchanged for years outside the CPI coverage', () => {
    expect(adjustForInflation(500, 1900)).toBe(500);
  });

  it('accepts string years as produced by date splitting', () => {
    expect(adjustForInflation(100, '1919')).toBeCloseTo(adjustForInflation(100, 1919), 9);
  });
});
