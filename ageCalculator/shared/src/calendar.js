/**
 * Calendar arithmetic for Bikram Sambat (BS) and Gregorian (AD) dates.
 *
 * Every conversion goes through a "day number": the count of days since
 * 1970-01-01 (UTC). Day numbers are plain integers, so there are no time zone
 * or daylight-saving surprises, and both calendars share one timeline.
 *
 * Months are 1-based everywhere (1 = Baisakh / January).
 */
import { BS_EPOCH_AD, BS_FIRST_YEAR, BS_MONTH_LENGTHS } from './bsData.js';

/** @typedef {'BS' | 'AD'} CalendarSystem */
/** @typedef {{ year: number, month: number, day: number }} DateParts */

export const CALENDARS = Object.freeze(['BS', 'AD']);

const MS_PER_DAY = 86_400_000;
const AD_MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const BS_LAST_YEAR = BS_FIRST_YEAR + BS_MONTH_LENGTHS.length - 1;

/* ------------------------------------------------------------------ */
/* Gregorian                                                           */
/* ------------------------------------------------------------------ */

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInAdMonth(year, month) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${month}`);
  }
  return month === 2 && isLeapYear(year) ? 29 : AD_MONTH_LENGTHS[month - 1];
}

/** @param {DateParts} date */
export function adToDayNumber({ year, month, day }) {
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

/** @returns {DateParts} */
export function dayNumberToAd(dayNumber) {
  const d = new Date(dayNumber * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/* ------------------------------------------------------------------ */
/* Bikram Sambat                                                       */
/* ------------------------------------------------------------------ */

const BS_EPOCH_DAY = adToDayNumber(BS_EPOCH_AD);

/** Day number of 1 Baisakh for every BS year in the table. */
const BS_YEAR_START = [];
let cursor = BS_EPOCH_DAY;
for (const months of BS_MONTH_LENGTHS) {
  BS_YEAR_START.push(cursor);
  cursor += months.reduce((sum, days) => sum + days, 0);
}

/** First and last day numbers covered by the BS table (inclusive). */
export const MIN_DAY_NUMBER = BS_EPOCH_DAY;
export const MAX_DAY_NUMBER = cursor - 1;

export function daysInBsMonth(year, month) {
  const row = BS_MONTH_LENGTHS[year - BS_FIRST_YEAR];
  if (!row) throw new RangeError(`BS year ${year} is outside ${BS_FIRST_YEAR}-${BS_LAST_YEAR}`);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${month}`);
  }
  return row[month - 1];
}

/** @param {DateParts} date */
export function bsToDayNumber({ year, month, day }) {
  const index = year - BS_FIRST_YEAR;
  const row = BS_MONTH_LENGTHS[index];
  if (!row) throw new RangeError(`BS year ${year} is outside ${BS_FIRST_YEAR}-${BS_LAST_YEAR}`);
  let dayNumber = BS_YEAR_START[index];
  for (let m = 0; m < month - 1; m += 1) dayNumber += row[m];
  return dayNumber + day - 1;
}

/** @returns {DateParts} */
export function dayNumberToBs(dayNumber) {
  if (dayNumber < MIN_DAY_NUMBER || dayNumber > MAX_DAY_NUMBER) {
    throw new RangeError('Date is outside the supported Bikram Sambat range');
  }
  // Binary search for the BS year that contains this day.
  let lo = 0;
  let hi = BS_YEAR_START.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (BS_YEAR_START[mid] <= dayNumber) lo = mid;
    else hi = mid - 1;
  }
  const row = BS_MONTH_LENGTHS[lo];
  let rest = dayNumber - BS_YEAR_START[lo];
  let monthIndex = 0;
  while (rest >= row[monthIndex]) {
    rest -= row[monthIndex];
    monthIndex += 1;
  }
  return { year: BS_FIRST_YEAR + lo, month: monthIndex + 1, day: rest + 1 };
}

/* ------------------------------------------------------------------ */
/* Calendar-agnostic helpers                                           */
/* ------------------------------------------------------------------ */

function assertCalendar(calendar) {
  if (calendar !== 'BS' && calendar !== 'AD') {
    throw new TypeError(`Unknown calendar "${calendar}" (expected "BS" or "AD")`);
  }
}

/** @param {number} year @param {number} month @param {CalendarSystem} calendar */
export function daysInMonth(year, month, calendar) {
  assertCalendar(calendar);
  return calendar === 'BS' ? daysInBsMonth(year, month) : daysInAdMonth(year, month);
}

/** @param {DateParts} date @param {CalendarSystem} calendar */
export function toDayNumber(date, calendar) {
  assertCalendar(calendar);
  return calendar === 'BS' ? bsToDayNumber(date) : adToDayNumber(date);
}

/** @param {number} dayNumber @param {CalendarSystem} calendar @returns {DateParts} */
export function fromDayNumber(dayNumber, calendar) {
  assertCalendar(calendar);
  return calendar === 'BS' ? dayNumberToBs(dayNumber) : dayNumberToAd(dayNumber);
}

/** True when the day number can be shown in both calendars. */
export function isSupportedDayNumber(dayNumber) {
  return Number.isInteger(dayNumber) && dayNumber >= MIN_DAY_NUMBER && dayNumber <= MAX_DAY_NUMBER;
}

/**
 * True when the date exists in the given calendar and falls inside the range
 * both calendars can represent.
 * @param {DateParts} date @param {CalendarSystem} calendar
 */
export function isValidDate(date, calendar) {
  if (!date) return false;
  const { year, month, day } = date;
  if (![year, month, day].every(Number.isInteger)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  try {
    if (day > daysInMonth(year, month, calendar)) return false;
    return isSupportedDayNumber(toDayNumber(date, calendar));
  } catch {
    return false;
  }
}

/** @param {DateParts} date @returns {DateParts} */
export function bsToAd(date) {
  if (!isValidDate(date, 'BS')) throw new RangeError('Invalid or unsupported BS date');
  return dayNumberToAd(bsToDayNumber(date));
}

/** @param {DateParts} date @returns {DateParts} */
export function adToBs(date) {
  if (!isValidDate(date, 'AD')) throw new RangeError('Invalid or unsupported AD date');
  return dayNumberToBs(adToDayNumber(date));
}

/** @param {DateParts} date @param {CalendarSystem} from @param {CalendarSystem} to */
export function convertDate(date, from, to) {
  if (from === to) return { ...date };
  return from === 'BS' ? bsToAd(date) : adToBs(date);
}

/** 0 = Sunday … 6 = Saturday. 1970-01-01 was a Thursday. */
export function weekdayOf(dayNumber) {
  return (((dayNumber + 4) % 7) + 7) % 7;
}

/**
 * Add whole months, clamping the day to the target month's length
 * (e.g. 32 Asar + 12 months → 31 Asar when the next Asar has 31 days).
 * @param {DateParts} date @param {number} count @param {CalendarSystem} calendar
 */
export function addMonths(date, count, calendar) {
  const index = date.year * 12 + (date.month - 1) + count;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const day = Math.min(date.day, daysInMonth(year, month, calendar));
  return { year, month, day };
}

/** @param {DateParts} date @param {number} count @param {CalendarSystem} calendar */
export function addYears(date, count, calendar) {
  return addMonths(date, count * 12, calendar);
}

/** The first and last supported dates, expressed in both calendars. */
export const SUPPORTED_RANGE = Object.freeze({
  minDayNumber: MIN_DAY_NUMBER,
  maxDayNumber: MAX_DAY_NUMBER,
  BS: { min: dayNumberToBs(MIN_DAY_NUMBER), max: dayNumberToBs(MAX_DAY_NUMBER) },
  AD: { min: dayNumberToAd(MIN_DAY_NUMBER), max: dayNumberToAd(MAX_DAY_NUMBER) },
});

/* ------------------------------------------------------------------ */
/* ISO strings ("YYYY-MM-DD") — used for storage and the API           */
/* ------------------------------------------------------------------ */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** @returns {DateParts | null} */
export function parseIsoDate(value) {
  const match = typeof value === 'string' ? ISO_DATE.exec(value.trim()) : null;
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** @param {DateParts} date */
export function formatIsoDate({ year, month, day }) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Compare two dates in the same calendar: negative, zero or positive. */
export function compareDates(a, b) {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}
