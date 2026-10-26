import { z } from 'zod';
import {
  FUTURE_DOB_TOLERANCE_DAYS,
  NAME_MAX_LENGTH,
  RELATIONS,
  SUPPORTED_RANGE,
  formatDate,
  formatIsoDate,
  fromDayNumber,
  isValidDate,
  parseIsoDate,
  toDayNumber,
} from '@umer/shared';
import { HttpError } from '../lib/httpError.js';

const memberInputSchema = z.object({
  name: z
    .string({ error: 'Enter a name' })
    .trim()
    .min(1, 'Enter a name')
    .max(NAME_MAX_LENGTH, `Use ${NAME_MAX_LENGTH} characters or fewer`),
  relation: z.enum([...RELATIONS, ''], { error: 'Choose a relation from the list' }).default(''),
  calendar: z.enum(['BS', 'AD'], { error: 'Calendar must be "BS" or "AD"' }),
  dob: z
    .string({ error: 'Enter a date of birth' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format for the date of birth'),
});

/** Check that the birth date exists, is supported and isn't in the future. Returns an error message or null. */
function checkBirthDate(calendar, dob, todayDay) {
  const parts = parseIsoDate(dob);
  if (!isValidDate(parts, calendar)) {
    const { min } = SUPPORTED_RANGE[calendar];
    const beforeRange = parts.year < min.year || (parts.year === min.year && parts.month < min.month);
    if (beforeRange) return `Dates before ${formatDate(min, calendar)} ${calendar} aren't supported`;
    if (parts.month < 1 || parts.month > 12) return `${dob} has no month ${parts.month}`;
    if (parts.year > SUPPORTED_RANGE[calendar].max.year) return "Date of birth can't be in the future";
    return `${dob} isn't a real date in the ${calendar} calendar`;
  }
  if (toDayNumber(parts, calendar) > todayDay + FUTURE_DOB_TOLERANCE_DAYS) {
    return "Date of birth can't be in the future";
  }
  return null;
}

/**
 * Validate a create/update payload and return the document fields to store.
 * Reports every invalid field at once as `fieldErrors`.
 * @param {unknown} body
 * @param {number} todayDay today's day number in the server's time zone
 */
export function parseMemberInput(body, todayDay) {
  const result = memberInputSchema.safeParse(body ?? {});
  const fieldErrors = {};
  if (!result.success) {
    for (const issue of result.error.issues) fieldErrors[issue.path[0] ?? 'body'] ??= issue.message;
  }

  const raw = body && typeof body === 'object' ? body : {};
  const calendar = result.success ? result.data.calendar : raw.calendar;
  const dob = result.success ? result.data.dob : raw.dob;
  if (!fieldErrors.dob && !fieldErrors.calendar && (calendar === 'BS' || calendar === 'AD')) {
    const message = checkBirthDate(calendar, dob, todayDay);
    if (message) fieldErrors.dob = message;
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new HttpError(400, 'Please fix the highlighted fields', fieldErrors);
  }

  const { name, relation } = result.data;
  const dayNumber = toDayNumber(parseIsoDate(dob), calendar);
  return {
    name,
    relation,
    dobAd: formatIsoDate(fromDayNumber(dayNumber, 'AD')),
    dobBs: formatIsoDate(fromDayNumber(dayNumber, 'BS')),
    enteredIn: calendar,
  };
}
