/** Names and display formatting for both calendars. */

/** @typedef {import('./calendar.js').CalendarSystem} CalendarSystem */
/** @typedef {import('./calendar.js').DateParts} DateParts */

export const BS_MONTHS = Object.freeze([
  { name: 'Baisakh', nepali: 'बैशाख' },
  { name: 'Jestha', nepali: 'जेठ' },
  { name: 'Asar', nepali: 'असार' },
  { name: 'Shrawan', nepali: 'साउन' },
  { name: 'Bhadra', nepali: 'भदौ' },
  { name: 'Asoj', nepali: 'असोज' },
  { name: 'Kartik', nepali: 'कात्तिक' },
  { name: 'Mangsir', nepali: 'मंसिर' },
  { name: 'Poush', nepali: 'पुस' },
  { name: 'Magh', nepali: 'माघ' },
  { name: 'Falgun', nepali: 'फागुन' },
  { name: 'Chaitra', nepali: 'चैत' },
]);

export const AD_MONTHS = Object.freeze(
  [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ].map((name) => ({ name, short: name.slice(0, 3) })),
);

export const WEEKDAYS = Object.freeze([
  { name: 'Sunday', short: 'Sun', nepali: 'आइतबार', nepaliShort: 'आइत' },
  { name: 'Monday', short: 'Mon', nepali: 'सोमबार', nepaliShort: 'सोम' },
  { name: 'Tuesday', short: 'Tue', nepali: 'मंगलबार', nepaliShort: 'मंगल' },
  { name: 'Wednesday', short: 'Wed', nepali: 'बुधबार', nepaliShort: 'बुध' },
  { name: 'Thursday', short: 'Thu', nepali: 'बिहीबार', nepaliShort: 'बिही' },
  { name: 'Friday', short: 'Fri', nepali: 'शुक्रबार', nepaliShort: 'शुक्र' },
  { name: 'Saturday', short: 'Sat', nepali: 'शनिबार', nepaliShort: 'शनि' },
]);

export const CALENDAR_LABELS = Object.freeze({
  BS: { short: 'BS', long: 'Bikram Sambat', nepali: 'वि.सं.' },
  AD: { short: 'AD', long: 'Gregorian', nepali: 'ई.सं.' },
});

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

/** "2083" → "२०८३" */
export function toNepaliDigits(value) {
  return String(value).replace(/\d/g, (digit) => NEPALI_DIGITS[Number(digit)]);
}

/** @param {number} month 1-12 @param {CalendarSystem} calendar */
export function monthName(month, calendar, { short = false } = {}) {
  if (calendar === 'BS') return BS_MONTHS[month - 1].name;
  const entry = AD_MONTHS[month - 1];
  return short ? entry.short : entry.name;
}

/**
 * "17 Mangsir 2032", "2 December 1975", "Tue, 2 Dec 1975 AD" …
 * @param {DateParts} date
 * @param {CalendarSystem} calendar
 * @param {{ short?: boolean, era?: boolean, weekday?: number | null }} [options]
 *   weekday: pass weekdayOf(dayNumber) to prefix the day name.
 */
export function formatDate(date, calendar, { short = false, era = false, weekday = null } = {}) {
  let text = `${date.day} ${monthName(date.month, calendar, { short })} ${date.year}`;
  if (era) text += ` ${CALENDAR_LABELS[calendar].short}`;
  if (weekday !== null && weekday !== undefined) {
    const name = short ? WEEKDAYS[weekday].short : WEEKDAYS[weekday].name;
    text = `${name}, ${text}`;
  }
  return text;
}

/** "17 Mangsir", "3 Dec" — for birthdays, where the year is implied. */
export function formatDayMonth(date, calendar, { short = false } = {}) {
  return `${date.day} ${monthName(date.month, calendar, { short })}`;
}

/** "असोज २०८३" */
export function formatNepaliMonthYear(year, month) {
  return `${BS_MONTHS[month - 1].nepali} ${toNepaliDigits(year)}`;
}

/** "1 day", "18,579 days" */
export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count.toLocaleString('en-US')} ${count === 1 ? singular : pluralForm}`;
}

/** "50 years, 10 months, 12 days" or compact "50y 10m 12d" */
export function formatAge({ years, months, days }, { compact = false } = {}) {
  if (compact) return `${years}y ${months}m ${days}d`;
  return `${plural(years, 'year')}, ${plural(months, 'month')}, ${plural(days, 'day')}`;
}

/** "today", "tomorrow", "in 12 days" */
export function formatDaysUntil(days) {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days.toLocaleString('en-US')} days`;
}

export function formatNumber(value) {
  return value.toLocaleString('en-US');
}
