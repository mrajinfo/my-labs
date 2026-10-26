import { Cake } from 'lucide-react';
import {
  CALENDAR_LABELS,
  WEEKDAYS,
  calculateAge,
  formatAge,
  formatDate,
  formatDaysUntil,
  fromDayNumber,
  plural,
  weekdayOf,
} from '@umer/shared';

function Era({ calendar }) {
  return <span className="text-[0.8125rem] font-medium text-ink-3">{CALENDAR_LABELS[calendar].short}</span>;
}

function Row({ term, children }) {
  return (
    <div className="grid gap-y-0.5 py-3 @min-[18rem]:grid-cols-[6.25rem_minmax(0,1fr)] @min-[18rem]:gap-x-4 @min-[26rem]:grid-cols-[7.5rem_minmax(0,1fr)]">
      <dt className="text-sm leading-6 text-ink-2">{term}</dt>
      <dd className="leading-6">{children}</dd>
    </div>
  );
}

/** Thin bar: how much of the current year of age has gone by. */
export function YearProgress({ value, className = '' }) {
  if (value === null || value === undefined) return null;
  return (
    <div aria-hidden="true" className={`h-1.5 overflow-hidden rounded-full bg-marigold-tint ${className}`}>
      <div className="h-full rounded-full bg-marigold" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

/** Supporting facts under the big age: weekday of birth, next birthday, time lived, the other calendar. */
export function AgeDetails({ birthDay, age, calendar, todayDay }) {
  const other = calendar === 'BS' ? 'AD' : 'BS';
  const otherAge = calculateAge(birthDay, todayDay, other);
  const sameSplit =
    otherAge.years === age.years && otherAge.months === age.months && otherAge.days === age.days;
  const { birthday } = age;

  return (
    <dl className="@container mt-5 divide-y divide-line border-y border-line text-[0.9375rem]">
      <Row term="Born on">
        <p className="font-medium text-ink">
          {WEEKDAYS[weekdayOf(birthDay)].name}, {formatDate(fromDayNumber(birthDay, calendar), calendar)}{' '}
          <Era calendar={calendar} />
        </p>
        <p className="text-ink-2">
          {formatDate(fromDayNumber(birthDay, other), other)} <Era calendar={other} />
        </p>
      </Row>

      <Row term={age.isBirthdayToday ? 'Birthday' : 'Next birthday'}>
        {!birthday && <p className="text-ink-2">Beyond the supported calendar range</p>}
        {birthday && age.isBirthdayToday && (
          <p className="flex items-center gap-2 font-medium text-marigold-ink">
            <Cake aria-hidden="true" className="size-4 text-marigold" />
            Happy birthday! Turns {birthday.turning} today.
          </p>
        )}
        {birthday && !age.isBirthdayToday && (
          <>
            <p className="font-medium text-ink">
              {formatDate(birthday.date, calendar, { weekday: birthday.weekday, short: calendar === 'AD' })}
            </p>
            <p className="text-ink-2">
              Turns {birthday.turning} {formatDaysUntil(birthday.daysUntil)}
            </p>
            <YearProgress value={age.yearProgress} className="mt-2 max-w-56" />
          </>
        )}
      </Row>

      <Row term="Time lived">
        <p className="font-medium text-ink">{plural(age.totalDays, 'day')}</p>
        <p className="text-ink-2">
          {plural(age.totalWeeks, 'week')}, or {plural(age.totalMonths, 'month')}
        </p>
      </Row>

      <Row term={`Age in ${other}`}>
        <p className="font-medium text-ink">{formatAge(otherAge)}</p>
        {!sameSplit && (
          <p className="text-sm text-ink-2">
            Months are different lengths in the two calendars, so the months and days can differ.
          </p>
        )}
      </Row>
    </dl>
  );
}
