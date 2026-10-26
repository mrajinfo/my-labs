import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MAX_DAY_NUMBER,
  MIN_DAY_NUMBER,
  addMonths,
  calculateAge,
  daysInBsMonth,
  diffYmd,
  fromDayNumber,
  parseIsoDate,
  toDayNumber,
} from '../src/index.js';

const day = (text, calendar) => toDayNumber(parseIsoDate(text), calendar);
const ymd = (age) => [age.years, age.months, age.days];

describe('calculateAge in BS', () => {
  const dob = day('2032-08-17', 'BS');
  const today = day('2083-06-29', 'BS');

  it('matches the reference screenshot: 50 years 10 months 12 days', () => {
    assert.deepEqual(ymd(calculateAge(dob, today, 'BS')), [50, 10, 12]);
  });

  it('counts down to the next BS birthday', () => {
    const age = calculateAge(dob, today, 'BS');
    assert.equal(age.birthday.daysUntil, 49); // 29 Asoj → 17 Mangsir 2083
    assert.equal(age.birthday.turning, 51);
    assert.deepEqual(age.birthday.date, { year: 2083, month: 8, day: 17 });
    assert.equal(age.isBirthdayToday, false);
  });

  it('gives the same total days in both calendars', () => {
    const bs = calculateAge(dob, today, 'BS');
    const ad = calculateAge(dob, today, 'AD');
    assert.equal(bs.totalDays, ad.totalDays);
    assert.equal(bs.totalDays, today - dob);
  });

  it('celebrates a birthday on the day', () => {
    const age = calculateAge(day('2050-06-29', 'BS'), today, 'BS');
    assert.deepEqual(ymd(age), [33, 0, 0]);
    assert.equal(age.isBirthdayToday, true);
    assert.equal(age.birthday.daysUntil, 0);
    assert.equal(age.birthday.turning, 33);
  });

  it('moves a 32nd-of-the-month birthday to the last day of a shorter month', () => {
    // Find a year whose Asar has 32 days, followed by a year whose Asar has 31.
    let year = 2000;
    while (!(daysInBsMonth(year, 3) === 32 && daysInBsMonth(year + 1, 3) === 31)) year += 1;
    const born = toDayNumber({ year, month: 3, day: 32 }, 'BS');
    const nextAsar31 = toDayNumber({ year: year + 1, month: 3, day: 31 }, 'BS');
    const age = calculateAge(born, nextAsar31, 'BS');
    assert.deepEqual(ymd(age), [1, 0, 0]);
    assert.equal(age.isBirthdayToday, true);
    assert.deepEqual(ymd(calculateAge(born, nextAsar31 - 1, 'BS')), [0, 11, 30]);
  });
});

describe('calculateAge in AD', () => {
  it('handles 29 February birthdays', () => {
    const dob = day('2000-02-29', 'AD');
    assert.deepEqual(ymd(calculateAge(dob, day('2001-02-27', 'AD'), 'AD')), [0, 11, 29]);
    const onBirthday = calculateAge(dob, day('2001-02-28', 'AD'), 'AD');
    assert.deepEqual(ymd(onBirthday), [1, 0, 0]);
    assert.equal(onBirthday.isBirthdayToday, true);
    assert.deepEqual(ymd(calculateAge(dob, day('2001-03-01', 'AD'), 'AD')), [1, 0, 1]);
    assert.deepEqual(ymd(calculateAge(dob, day('2004-02-29', 'AD'), 'AD')), [4, 0, 0]);
  });

  it('handles month ends', () => {
    const dob = day('2023-01-31', 'AD');
    assert.deepEqual(ymd(calculateAge(dob, day('2023-02-28', 'AD'), 'AD')), [0, 1, 0]);
    assert.deepEqual(ymd(calculateAge(dob, day('2023-03-01', 'AD'), 'AD')), [0, 1, 1]);
    assert.deepEqual(ymd(calculateAge(dob, day('2023-03-31', 'AD'), 'AD')), [0, 2, 0]);
  });

  it('handles newborns and future dates', () => {
    const today = day('2026-10-15', 'AD');
    const newborn = calculateAge(today, today, 'AD');
    assert.deepEqual(ymd(newborn), [0, 0, 0]);
    assert.equal(newborn.isBornToday, true);
    assert.equal(newborn.isBirthdayToday, false);
    assert.equal(newborn.birthday.turning, 1);
    assert.equal(newborn.birthday.daysUntil, 365);
    assert.equal(calculateAge(today + 1, today, 'AD'), null);
  });
});

describe('diffYmd invariants', () => {
  it('always lands exactly on the end date in both calendars', () => {
    // Deterministic pseudo-random pairs across the whole supported range.
    let seed = 42;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };
    const span = MAX_DAY_NUMBER - MIN_DAY_NUMBER - 400;
    for (let i = 0; i < 4000; i += 1) {
      const from = MIN_DAY_NUMBER + Math.floor(random() * span);
      const to = from + Math.floor(random() * Math.min(span - (from - MIN_DAY_NUMBER), 40000));
      for (const calendar of ['BS', 'AD']) {
        const { years, months, days } = diffYmd(from, to, calendar);
        assert.ok(months >= 0 && months < 12);
        assert.ok(days >= 0 && days < 32);
        const start = fromDayNumber(from, calendar);
        const anchor = toDayNumber(addMonths(start, years * 12 + months, calendar), calendar);
        assert.equal(anchor + days, to, `${calendar} ${from}→${to}`);
      }
    }
  });
});
