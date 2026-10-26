import {
  adToDayNumber,
  calculateAge,
  formatIsoDate,
  fromDayNumber,
  parseIsoDate,
} from '@umer/shared';

function summarize(age) {
  if (!age) return null;
  return {
    years: age.years,
    months: age.months,
    days: age.days,
    isBirthdayToday: age.isBirthdayToday,
    birthday: age.birthday && {
      date: formatIsoDate(age.birthday.date),
      daysUntil: age.birthday.daysUntil,
      turning: age.birthday.turning,
    },
  };
}

/** "Today" in both calendars, for the `asOf` field of responses. */
export function describeDay(dayNumber, timeZone) {
  return {
    ad: formatIsoDate(fromDayNumber(dayNumber, 'AD')),
    bs: formatIsoDate(fromDayNumber(dayNumber, 'BS')),
    timeZone,
  };
}

/**
 * API shape of a member, with the age worked out for `todayDay`.
 * Ages are computed on every request, so they move forward day by day.
 */
export function serializeMember(doc, todayDay) {
  const dobDay = adToDayNumber(parseIsoDate(doc.dobAd));
  const bs = calculateAge(dobDay, todayDay, 'BS');
  const ad = calculateAge(dobDay, todayDay, 'AD');
  return {
    id: doc._id.toString(),
    name: doc.name,
    relation: doc.relation || '',
    dob: { ad: doc.dobAd, bs: doc.dobBs },
    enteredIn: doc.enteredIn,
    age: {
      totalDays: bs ? bs.totalDays : null,
      bs: summarize(bs),
      ad: summarize(ad),
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
