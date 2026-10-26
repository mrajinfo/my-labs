/** Rules for family member records, shared by the API validation and the form. */

export const RELATIONS = Object.freeze([
  'Self',
  'Spouse',
  'Father',
  'Mother',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Grandson',
  'Granddaughter',
  'Uncle',
  'Aunt',
  'Nephew',
  'Niece',
  'Cousin',
  'Father-in-law',
  'Mother-in-law',
  'Son-in-law',
  'Daughter-in-law',
  'Brother-in-law',
  'Sister-in-law',
  'Friend',
  'Other',
]);

export const NAME_MAX_LENGTH = 60;

/**
 * Days of tolerance when rejecting "future" birth dates, so a parent in a time
 * zone ahead of the server can still save a baby born today.
 */
export const FUTURE_DOB_TOLERANCE_DAYS = 1;
