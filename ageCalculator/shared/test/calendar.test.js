import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BS_FIRST_YEAR,
  BS_LAST_OFFICIAL_YEAR,
  BS_MONTH_LENGTHS,
  SUPPORTED_RANGE,
  adToBs,
  bsToAd,
  bsToDayNumber,
  dayNumberToBs,
  formatIsoDate,
  isValidDate,
  parseIsoDate,
  todayInTimeZone,
  weekdayOf,
  adToDayNumber,
  MIN_DAY_NUMBER,
  MAX_DAY_NUMBER,
  formatDate,
  formatNepaliMonthYear,
} from '../src/index.js';

const iso = (text) => parseIsoDate(text);

// BS ↔ AD pairs from national days and printed calendars (Hamro Patro).
const KNOWN_DATES = [
  ['2000-01-01', '1943-04-14', 'BS 2000 new year'],
  ['2007-11-07', '1951-02-18', 'Democracy Day'],
  ['2046-11-07', '1990-02-18', 'Jana Andolan begins'],
  ['2058-02-19', '2001-06-01', '19 Jestha 2058'],
  ['2062-01-01', '2005-04-14', 'BS 2062 new year'],
  ['2062-03-01', '2005-06-15', '1 Asar 2062'],
  ['2063-01-11', '2006-04-24', 'Loktantra Diwas'],
  ['2065-02-15', '2008-05-28', 'Republic Day'],
  ['2072-01-12', '2015-04-25', 'Gorkha earthquake'],
  ['2072-06-03', '2015-09-20', 'Constitution Day'],
  ['2081-01-01', '2024-04-13', 'BS 2081 new year'],
  ['2082-01-01', '2025-04-14', 'BS 2082 new year'],
  ['2083-01-01', '2026-04-14', 'BS 2083 new year'],
  ['2083-06-29', '2026-10-15', '29 Asoj 2083'],
  ['2084-01-01', '2027-04-14', 'BS 2084 new year'],
  ['2084-02-01', '2027-05-15', '1 Jestha 2084'],
  ['2084-04-01', '2027-07-17', '1 Shrawan 2084'],
  ['2084-12-01', '2028-03-14', '1 Chaitra 2084'],
  ['2084-12-30', '2028-04-12', 'last day of 2084'],
  ['2085-02-01', '2028-05-14', '1 Jestha 2085'],
];

describe('BS data table', () => {
  it('has twelve months of 29-32 days for every year', () => {
    BS_MONTH_LENGTHS.forEach((row, index) => {
      assert.equal(row.length, 12, `BS ${BS_FIRST_YEAR + index}`);
      for (const days of row) assert.ok(days >= 29 && days <= 32, `BS ${BS_FIRST_YEAR + index}`);
    });
  });

  it('has 365 or 366 days in every published year', () => {
    BS_MONTH_LENGTHS.forEach((row, index) => {
      const year = BS_FIRST_YEAR + index;
      if (year > BS_LAST_OFFICIAL_YEAR) return;
      const total = row.reduce((sum, days) => sum + days, 0);
      assert.ok(total === 365 || total === 366, `BS ${year} has ${total} days`);
    });
  });

  it('covers 1 Baisakh 1975 BS (13 April 1918) onwards', () => {
    assert.deepEqual(SUPPORTED_RANGE.BS.min, { year: 1975, month: 1, day: 1 });
    assert.deepEqual(SUPPORTED_RANGE.AD.min, { year: 1918, month: 4, day: 13 });
    assert.equal(SUPPORTED_RANGE.BS.max.year, 2100);
  });
});

describe('conversion', () => {
  for (const [bs, ad, label] of KNOWN_DATES) {
    it(`${bs} BS = ${ad} AD (${label})`, () => {
      assert.equal(formatIsoDate(bsToAd(iso(bs))), ad);
      assert.equal(formatIsoDate(adToBs(iso(ad))), bs);
    });
  }

  it('round-trips every supported day', () => {
    let previous = null;
    for (let n = MIN_DAY_NUMBER; n <= MAX_DAY_NUMBER; n += 1) {
      const bs = dayNumberToBs(n);
      assert.equal(bsToDayNumber(bs), n);
      if (previous) {
        const sameMonth = bs.year === previous.year && bs.month === previous.month;
        if (sameMonth) assert.equal(bs.day, previous.day + 1);
        else assert.equal(bs.day, 1);
      }
      previous = bs;
    }
  });

  it('knows weekdays', () => {
    assert.equal(weekdayOf(adToDayNumber(iso('2026-10-15'))), 4); // Thursday
    assert.equal(weekdayOf(bsToDayNumber(iso('2000-01-01'))), 3); // Wednesday
    assert.equal(weekdayOf(bsToDayNumber(iso('2084-02-01'))), 6); // Saturday
  });
});

describe('validation', () => {
  it('rejects days that do not exist', () => {
    assert.equal(isValidDate(iso('2083-03-32'), 'BS'), true); // Asar 2083 has 32 days
    assert.equal(isValidDate(iso('2083-06-32'), 'BS'), false); // Asoj 2083 has 31
    assert.equal(isValidDate(iso('2024-02-29'), 'AD'), true);
    assert.equal(isValidDate(iso('2023-02-29'), 'AD'), false);
    assert.equal(isValidDate(iso('2083-13-01'), 'BS'), false);
    assert.equal(isValidDate(iso('2083-00-10'), 'BS'), false);
  });

  it('rejects dates outside the calendar data', () => {
    assert.equal(isValidDate(iso('1974-12-30'), 'BS'), false);
    assert.equal(isValidDate(iso('1918-04-12'), 'AD'), false);
    assert.equal(isValidDate(iso('1918-04-13'), 'AD'), true);
    assert.equal(isValidDate(iso('2101-01-01'), 'BS'), false);
  });

  it('parses only strict ISO strings', () => {
    assert.deepEqual(parseIsoDate('2032-08-17'), { year: 2032, month: 8, day: 17 });
    assert.equal(parseIsoDate('2032-8-17'), null);
    assert.equal(parseIsoDate(20320817), null);
  });
});

describe('formatting and today', () => {
  it('formats dates in both calendars', () => {
    assert.equal(formatDate(iso('2032-08-17'), 'BS'), '17 Mangsir 2032');
    assert.equal(formatDate(iso('1975-12-02'), 'AD', { short: true, era: true }), '2 Dec 1975 AD');
    assert.equal(formatDate(iso('2026-10-15'), 'AD', { weekday: 4 }), 'Thursday, 15 October 2026');
    assert.equal(formatNepaliMonthYear(2083, 6), 'असोज २०८३');
  });

  it('reads today in Nepal time', () => {
    // 18:20 UTC is already 00:05 the next day in Kathmandu (UTC+05:45).
    const instant = new Date('2026-10-14T18:20:00Z');
    assert.deepEqual(todayInTimeZone('Asia/Kathmandu', instant), { year: 2026, month: 10, day: 15 });
    assert.deepEqual(todayInTimeZone('UTC', instant), { year: 2026, month: 10, day: 14 });
  });
});
