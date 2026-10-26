import { calculateAge, fromDayNumber } from '@umer/shared';
import { memberBirthDay } from './dates.js';

export const SORT_OPTIONS = Object.freeze([
  { value: 'birthday', label: 'Next birthday' },
  { value: 'name', label: 'Name, A to Z' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'youngest', label: 'Youngest first' },
  { value: 'recent', label: 'Recently added' },
]);

const byName = (a, b) => a.member.name.localeCompare(b.member.name, 'en', { sensitivity: 'base' });
const daysUntil = (row) => row.age?.birthday?.daysUntil ?? Number.POSITIVE_INFINITY;

const COMPARATORS = {
  birthday: (a, b) => daysUntil(a) - daysUntil(b) || byName(a, b),
  name: byName,
  oldest: (a, b) => a.birthDay - b.birthDay || byName(a, b),
  youngest: (a, b) => b.birthDay - a.birthDay || byName(a, b),
  recent: (a, b) => new Date(b.member.createdAt) - new Date(a.member.createdAt),
};

/**
 * A member with their age worked out for `todayDay` in the chosen calendar.
 * Recomputed on every render, so the list moves forward at midnight.
 */
export function describeMember(member, todayDay, calendar) {
  const birthDay = memberBirthDay(member);
  return {
    member,
    birthDay,
    birth: fromDayNumber(birthDay, calendar),
    age: calculateAge(birthDay, todayDay, calendar),
  };
}

export function buildRows(members, { todayDay, calendar, query, sort }) {
  const needle = query.trim().toLocaleLowerCase();
  const rows = members
    .filter(
      (member) =>
        !needle ||
        member.name.toLocaleLowerCase().includes(needle) ||
        member.relation.toLocaleLowerCase().includes(needle),
    )
    .map((member) => describeMember(member, todayDay, calendar));
  return rows.sort(COMPARATORS[sort] ?? COMPARATORS.birthday);
}

/** The soonest birthday across the whole family (today counts). */
export function nextBirthdayRow(members, todayDay, calendar) {
  let best = null;
  for (const member of members) {
    const row = describeMember(member, todayDay, calendar);
    if (!row.age?.birthday) continue;
    if (!best || COMPARATORS.birthday(row, best) < 0) best = row;
  }
  return best;
}

/** Up to two initials, Devanagari-aware (keeps combining marks with their letter). */
export function initialsOf(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const firstGrapheme = (word) => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const [first] = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word);
      return first?.segment ?? '';
    }
    return word[0] ?? '';
  };
  const letters = words.slice(0, 2).map(firstGrapheme).join('');
  return letters.toLocaleUpperCase() || '?';
}

const AVATAR_TONES = [
  'bg-brand-tint text-brand',
  'bg-crimson-tint text-crimson-strong',
  'bg-marigold-tint text-marigold-ink',
  'bg-[#e2f3ef] text-[#0d6656]',
  'bg-[#f0e8f7] text-[#62287f]',
  'bg-[#e8f3df] text-[#33601a]',
];

/** A stable colour for a person's avatar, derived from their name. */
export function avatarTone(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}
