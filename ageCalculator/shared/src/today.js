/** "Today" helpers. Ages are always measured against a calendar day, not an instant. */
import { adToDayNumber } from './calendar.js';

/**
 * Today's Gregorian date in an IANA time zone, e.g. "Asia/Kathmandu".
 * Omit the zone to use the runtime's local zone.
 */
export function todayInTimeZone(timeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const get = (type) => Number(parts.find((part) => part.type === type).value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** Day number for today in the given time zone (local zone when omitted). */
export function todayDayNumber(timeZone, now = new Date()) {
  return adToDayNumber(todayInTimeZone(timeZone, now));
}

/** Milliseconds until the next local midnight — when every age ticks over. */
export function msUntilNextLocalMidnight(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}
