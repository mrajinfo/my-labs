import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  CALENDAR_LABELS,
  MAX_DAY_NUMBER,
  MIN_DAY_NUMBER,
  WEEKDAYS,
  daysInMonth,
  formatDate,
  formatNepaliMonthYear,
  fromDayNumber,
  monthName,
  toDayNumber,
  weekdayOf,
} from '@umer/shared';
import { useState } from 'react';
import { useCalendarMode } from '../state/calendarMode.js';
import { useToday } from '../state/today.js';
import { CalendarSwitch } from './CalendarSwitch.jsx';
import { Button, IconButton } from './ui/Button.jsx';
import { Dialog, DialogBody } from './ui/Dialog.jsx';

const monthOf = (dayNumber, calendar) => {
  const { year, month } = fromDayNumber(dayNumber, calendar);
  return { year, month };
};

const shiftMonth = ({ year, month }, delta) => {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

/** "Nov – Dec 1975" or "Dec 1975 – Jan 1976": the other calendar's months under this one. */
function describeSpan(start, end, calendar) {
  const name = (date) => monthName(date.month, calendar, { short: true });
  if (start.year === end.year && start.month === end.month) return `${name(start)} ${start.year}`;
  if (start.year === end.year) return `${name(start)} – ${name(end)} ${start.year}`;
  return `${name(start)} ${start.year} – ${name(end)} ${end.year}`;
}

function DayCell({ dayNumber, calendar, other, isBirth, isToday, isBirthday }) {
  const date = fromDayNumber(dayNumber, calendar);
  const otherDate = fromDayNumber(dayNumber, other);
  const weekday = weekdayOf(dayNumber);
  const otherLabel =
    otherDate.day === 1 ? `${monthName(otherDate.month, other, { short: true })} 1` : String(otherDate.day);
  const notes = [isBirth && 'birth date', isBirthday && 'birthday', isToday && 'today'].filter(Boolean);

  return (
    <div
      className={clsx(
        'relative flex h-12 flex-col items-center justify-center rounded-lg leading-none sm:h-14',
        isBirth && 'bg-brand text-white',
        !isBirth && isBirthday && 'bg-marigold-tint text-marigold-ink',
        !isBirth && !isBirthday && (weekday === 6 ? 'text-crimson' : 'text-ink'),
        isToday && 'ring-2 ring-crimson ring-inset',
      )}
    >
      <span aria-hidden="true" className="text-lg font-semibold tabular-nums [font-stretch:112%] sm:text-xl">
        {date.day}
      </span>
      <span
        aria-hidden="true"
        className={clsx('mt-1 text-[0.6875rem] tabular-nums', isBirth ? 'text-white/80' : 'text-ink-3')}
      >
        {otherLabel}
      </span>
      <span className="sr-only">
        {WEEKDAYS[weekday].name}, {formatDate(date, calendar)} {calendar} ({formatDate(otherDate, other)} {other})
        {notes.length > 0 && `, ${notes.join(', ')}`}
      </span>
    </div>
  );
}

function MonthCalendar({ focusDay }) {
  const { calendar: appCalendar } = useCalendarMode();
  const todayDay = useToday();
  const [calendar, setCalendar] = useState(appCalendar);
  const [view, setView] = useState(() => monthOf(focusDay ?? todayDay, appCalendar));
  const other = calendar === 'BS' ? 'AD' : 'BS';

  const first = toDayNumber({ ...view, day: 1 }, calendar);
  const length = daysInMonth(view.year, view.month, calendar);
  const cells = [...Array(weekdayOf(first)).fill(null), ...Array.from({ length }, (_, i) => first + i)];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  // The birthday in this month, if there is one (32 Asar falls on 31 Asar in a 31-day Asar).
  const birth = focusDay === null || focusDay === undefined ? null : fromDayNumber(focusDay, calendar);
  const birthdayDay =
    birth && birth.month === view.month && view.year > birth.year ? first + Math.min(birth.day, length) - 1 : null;

  const inView = (dayNumber) =>
    dayNumber !== null && dayNumber !== undefined && dayNumber >= first && dayNumber < first + length;
  const canGoBack = first - 1 >= MIN_DAY_NUMBER;
  const canGoForward = first + length <= MAX_DAY_NUMBER;

  const switchCalendar = (next) => {
    setCalendar(next);
    setView(monthOf(first + Math.floor(length / 2), next));
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <IconButton label="Previous month" onClick={() => setView((v) => shiftMonth(v, -1))} disabled={!canGoBack}>
          <ChevronLeft />
        </IconButton>
        <div className="min-w-0 flex-1 text-center" aria-live="polite">
          <p className="text-lg leading-tight font-semibold">
            {monthName(view.month, calendar)} {view.year}{' '}
            <span className="text-sm font-medium text-ink-3">{CALENDAR_LABELS[calendar].short}</span>
          </p>
          <p className="text-sm text-ink-2">
            {calendar === 'BS' && (
              <span lang="ne" className="mr-2">
                {formatNepaliMonthYear(view.year, view.month)}
              </span>
            )}
            {describeSpan(fromDayNumber(first, other), fromDayNumber(first + length - 1, other), other)}{' '}
            {CALENDAR_LABELS[other].short}
          </p>
        </div>
        <IconButton label="Next month" onClick={() => setView((v) => shiftMonth(v, 1))} disabled={!canGoForward}>
          <ChevronRight />
        </IconButton>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <CalendarSwitch size="sm" value={calendar} onChange={switchCalendar} label="Calendar for this view" />
        <div className="flex gap-1">
          {birth && (
            <Button size="sm" variant="ghost" onClick={() => setView(monthOf(focusDay, calendar))}>
              Birth month
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setView(monthOf(todayDay, calendar))}>
            This month
          </Button>
        </div>
      </div>

      <table className="mt-3 w-full table-fixed border-separate border-spacing-1">
        <caption className="sr-only">
          {monthName(view.month, calendar)} {view.year} {calendar}
        </caption>
        <thead>
          <tr>
            {WEEKDAYS.map((weekday, index) => (
              <th
                key={weekday.name}
                scope="col"
                className={clsx('pb-1 text-xs font-semibold', index === 6 ? 'text-crimson' : 'text-ink-3')}
              >
                <abbr title={weekday.name} className="no-underline">
                  {weekday.short}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.find((day) => day !== null)}>
              {week.map((dayNumber, index) => (
                <td key={index} className="p-0 align-top">
                  {dayNumber !== null && (
                    <DayCell
                      dayNumber={dayNumber}
                      calendar={calendar}
                      other={other}
                      isBirth={dayNumber === focusDay}
                      isBirthday={dayNumber === birthdayDay}
                      isToday={dayNumber === todayDay}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2" aria-label="Key">
        {inView(focusDay) && (
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3.5 rounded bg-brand" /> Birth date
          </li>
        )}
        {birthdayDay !== null && (
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3.5 rounded bg-marigold-tint ring-1 ring-marigold/50" /> Birthday
          </li>
        )}
        {inView(todayDay) && (
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3.5 rounded ring-2 ring-crimson ring-inset" /> Today
          </li>
        )}
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="text-xs font-semibold text-crimson">
            Sat
          </span>
          Saturdays in red
        </li>
      </ul>
    </div>
  );
}

/** Patro-style month view: BS (or AD) day numbers, with the other calendar's day under each. */
export function CalendarDialog({ open, onClose, focusDay = null, title = 'Calendar' }) {
  return (
    <Dialog open={open} onClose={onClose} title={title} width="30rem">
      <DialogBody>
        <MonthCalendar focusDay={focusDay} />
      </DialogBody>
    </Dialog>
  );
}
