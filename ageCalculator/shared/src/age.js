/**
 * Age arithmetic that works in either calendar.
 *
 * Rule: count whole years, then whole months, then the remaining days, where a
 * month boundary that doesn't exist (32 Asar in a 31-day Asar, 29 February in
 * a common year) falls on the last day of that month. With this rule the age
 * reads exactly "N years 0 months 0 days" on every birthday, so the birthday
 * countdown and the age never disagree.
 *
 * The same birth date gives a slightly different month/day split in BS and
 * AD because their months have different lengths; the total days are equal.
 */
import { addMonths, addYears, fromDayNumber, toDayNumber, weekdayOf } from './calendar.js';

/** @typedef {import('./calendar.js').CalendarSystem} CalendarSystem */
/** @typedef {import('./calendar.js').DateParts} DateParts */

/**
 * Whole years, months and days from one day number to a later one.
 * @param {number} fromDay @param {number} toDay @param {CalendarSystem} calendar
 */
export function diffYmd(fromDay, toDay, calendar) {
  if (toDay < fromDay) throw new RangeError('The end date is before the start date');
  const start = fromDayNumber(fromDay, calendar);
  const end = fromDayNumber(toDay, calendar);

  let totalMonths = (end.year - start.year) * 12 + (end.month - start.month);
  let anchor = toDayNumber(addMonths(start, totalMonths, calendar), calendar);
  if (anchor > toDay) {
    totalMonths -= 1;
    anchor = toDayNumber(addMonths(start, totalMonths, calendar), calendar);
  }

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days: toDay - anchor,
  };
}

/**
 * @typedef {object} Birthday
 * @property {DateParts} date        the birthday in the requested calendar
 * @property {number} dayNumber
 * @property {number} daysUntil      0 when the birthday is today
 * @property {number} turning        the age reached on that day
 * @property {number} weekday        0 = Sunday … 6 = Saturday
 */

/**
 * @typedef {object} Age
 * @property {CalendarSystem} calendar
 * @property {number} years
 * @property {number} months
 * @property {number} days
 * @property {number} totalDays
 * @property {number} totalWeeks
 * @property {number} totalMonths
 * @property {boolean} isBirthdayToday
 * @property {boolean} isBornToday
 * @property {Birthday | null} birthday   today's or the next birthday (null past the data range)
 * @property {number | null} yearProgress share of the current year of age already lived (0–1)
 */

/**
 * Age on `todayDay` of someone born on `dobDay`, in the given calendar.
 * Returns null when the birth date is after today.
 * @param {number} dobDay @param {number} todayDay @param {CalendarSystem} calendar
 * @returns {Age | null}
 */
export function calculateAge(dobDay, todayDay, calendar) {
  if (dobDay > todayDay) return null;

  const { years, months, days } = diffYmd(dobDay, todayDay, calendar);
  const totalDays = todayDay - dobDay;
  const dob = fromDayNumber(dobDay, calendar);
  const isBirthdayToday = years > 0 && months === 0 && days === 0;

  const lastBirthdayDay = toDayNumber(addYears(dob, years, calendar), calendar);
  let nextBirthday = null;
  try {
    const date = addYears(dob, years + 1, calendar);
    const dayNumber = toDayNumber(date, calendar);
    nextBirthday = {
      date,
      dayNumber,
      daysUntil: dayNumber - todayDay,
      turning: years + 1,
      weekday: weekdayOf(dayNumber),
    };
  } catch {
    // The next birthday is beyond the calendar data; leave it unknown.
  }

  const birthday = isBirthdayToday
    ? {
        date: fromDayNumber(todayDay, calendar),
        dayNumber: todayDay,
        daysUntil: 0,
        turning: years,
        weekday: weekdayOf(todayDay),
      }
    : nextBirthday;

  const yearProgress = nextBirthday
    ? (todayDay - lastBirthdayDay) / (nextBirthday.dayNumber - lastBirthdayDay)
    : null;

  return {
    calendar,
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
    isBirthdayToday,
    isBornToday: totalDays === 0,
    birthday,
    yearProgress,
  };
}
