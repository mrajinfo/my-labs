import clsx from 'clsx';
import {
  CALENDAR_LABELS,
  WEEKDAYS,
  formatDate,
  formatNepaliMonthYear,
  fromDayNumber,
  monthName,
  toNepaliDigits,
  weekdayOf,
} from '@umer/shared';
import { useCalendarMode } from '../state/calendarMode.js';
import { useToday } from '../state/today.js';

/**
 * Today's page of the patro: a big date in the chosen calendar, the other
 * calendar beside it. Saturdays print in red, as on a Nepali wall calendar.
 */
export function TodayCard() {
  const { calendar } = useCalendarMode();
  const todayDay = useToday();
  const other = calendar === 'BS' ? 'AD' : 'BS';
  const date = fromDayNumber(todayDay, calendar);
  const otherDate = fromDayNumber(todayDay, other);
  const bs = calendar === 'BS' ? date : otherDate;
  const weekday = weekdayOf(todayDay);
  const isSaturday = weekday === 6;

  return (
    <section aria-labelledby="today-heading" className="overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-line">
      <div className="flex h-8 items-center justify-between bg-crimson px-4 text-[0.8125rem] font-semibold text-white sm:px-5">
        <h2 id="today-heading">Today</h2>
        <span lang="ne" aria-hidden="true" className="font-medium opacity-90">
          आज
        </span>
      </div>

      <div className="flex items-center gap-4 px-4 py-4 sm:gap-5 sm:px-5 md:flex-col md:gap-2 md:pt-3 md:pb-5 md:text-center lg:flex-row lg:gap-5 lg:py-4 lg:text-left">
        <p
          aria-hidden="true"
          className={clsx(
            'figure min-w-[5.5rem] shrink-0 text-center text-[3.5rem] sm:min-w-[6.25rem] sm:text-[4rem] md:text-[4.5rem] lg:text-[4rem]',
            isSaturday ? 'text-crimson' : 'text-ink',
          )}
        >
          {date.day}
        </p>
        <div className="min-w-0 flex-1 border-l border-line pl-4 sm:pl-5 md:w-full md:border-t md:border-l-0 md:pt-3 md:pl-0 lg:w-auto lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
          <p className="text-lg leading-snug font-semibold">
            <span className="sr-only">
              {WEEKDAYS[weekday].name}, {date.day}{' '}
            </span>
            {monthName(date.month, calendar)} {date.year}{' '}
            <span className="text-sm font-medium text-ink-3">{CALENDAR_LABELS[calendar].short}</span>
          </p>
          <p className={clsx('leading-snug', isSaturday ? 'text-crimson' : 'text-ink-2')}>{WEEKDAYS[weekday].name}</p>
          <p className="mt-1.5 text-sm leading-snug text-ink-2">
            {formatDate(otherDate, other, { short: true })}{' '}
            <span className="text-ink-3">{CALENDAR_LABELS[other].short}</span>
          </p>
          <p lang="ne" className="text-sm leading-snug text-ink-3">
            {WEEKDAYS[weekday].nepali}, {toNepaliDigits(bs.day)} {formatNepaliMonthYear(bs.year, bs.month)}
          </p>
        </div>
      </div>
    </section>
  );
}
