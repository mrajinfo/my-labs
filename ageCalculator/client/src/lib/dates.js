/** Helpers for the year / month / day pickers and for member records. */
import {
  SUPPORTED_RANGE,
  adToDayNumber,
  daysInMonth,
  fromDayNumber,
  isValidDate,
  monthName,
  parseIsoDate,
  toDayNumber,
} from '@umer/shared';

/** Picker state: each part is a number, or '' while not chosen yet. */
export const EMPTY_PARTS = Object.freeze({ year: '', month: '', day: '' });

export const isComplete = (parts) => parts.year !== '' && parts.month !== '' && parts.day !== '';

/** Day number for complete, valid parts — otherwise null. */
export function partsToDayNumber(parts, calendar) {
  if (!isComplete(parts) || !isValidDate(parts, calendar)) return null;
  return toDayNumber(parts, calendar);
}

/** Re-express picker parts in another calendar (incomplete parts can't be converted). */
export function convertParts(parts, from, to) {
  if (from === to) return parts;
  const dayNumber = partsToDayNumber(parts, from);
  return dayNumber === null ? EMPTY_PARTS : fromDayNumber(dayNumber, to);
}

const firstDayOfMonth = (year, month, calendar) => toDayNumber({ year, month, day: 1 }, calendar);

/** Birth years, newest first, from this year back to the first supported year. */
export function yearOptions(calendar, todayDay) {
  const first = SUPPORTED_RANGE[calendar].min.year;
  const last = fromDayNumber(todayDay, calendar).year;
  const years = [];
  for (let year = last; year >= first; year -= 1) years.push(year);
  return years;
}

/** Months of a year, with months after today or before the supported range disabled. */
export function monthOptions(calendar, year, todayDay) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    let disabled = false;
    if (year !== '') {
      const start = firstDayOfMonth(year, month, calendar);
      const end = start + daysInMonth(year, month, calendar) - 1;
      disabled = start > todayDay || end < SUPPORTED_RANGE.minDayNumber;
    }
    // BS dates are usually written as numbers (2032/08/17), so BS months show theirs.
    const label = calendar === 'BS' ? `${String(month).padStart(2, '0')} ${monthName(month, 'BS')}` : monthName(month, 'AD');
    return { value: month, label, disabled };
  });
}

/** Days of a month, with days after today or before the supported range disabled. */
export function dayOptions(calendar, year, month, todayDay) {
  if (year === '' || month === '') {
    return Array.from({ length: calendar === 'BS' ? 32 : 31 }, (_, i) => ({ value: i + 1, disabled: false }));
  }
  const start = firstDayOfMonth(year, month, calendar);
  return Array.from({ length: daysInMonth(year, month, calendar) }, (_, i) => ({
    value: i + 1,
    disabled: start + i > todayDay || start + i < SUPPORTED_RANGE.minDayNumber,
  }));
}

/**
 * After the year or month changes, clear any part that no longer fits
 * (rather than silently moving someone's birthday to a different day).
 */
export function tidyParts(parts, calendar, todayDay) {
  let { year, month, day } = parts;
  if (year !== '' && month !== '') {
    const option = monthOptions(calendar, year, todayDay)[month - 1];
    if (option.disabled) {
      month = '';
      day = '';
    }
  }
  if (day !== '' && year !== '' && month !== '') {
    const option = dayOptions(calendar, year, month, todayDay)[day - 1];
    if (!option || option.disabled) day = '';
  }
  return { year, month, day };
}

/** Day number of a saved member's birth date. */
export const memberBirthDay = (member) => adToDayNumber(parseIsoDate(member.dob.ad));
