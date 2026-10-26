import { CalendarDays, UserPlus } from 'lucide-react';
import { CALENDAR_LABELS, calculateAge, formatAge } from '@umer/shared';
import { useCallback, useMemo, useState } from 'react';
import { EMPTY_PARTS, convertParts, isComplete, partsToDayNumber } from '../lib/dates.js';
import { useCalendarMode } from '../state/calendarMode.js';
import { useToday } from '../state/today.js';
import { AgeDetails } from './AgeDetails.jsx';
import { AgeFigure } from './AgeFigure.jsx';
import { CalendarDialog } from './CalendarDialog.jsx';
import { DobFields } from './DobFields.jsx';
import { MemberDialog } from './MemberDialog.jsx';
import { Button } from './ui/Button.jsx';

export function AgeCalculator() {
  const { calendar } = useCalendarMode();
  const todayDay = useToday();
  // Keep the picked date in the calendar it was picked in; it is re-expressed
  // whenever the header switch changes, so switching never loses it.
  const [selection, setSelection] = useState({ calendar, parts: EMPTY_PARTS });
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(null);
  const closeDialog = useCallback(() => setOpenDialog(null), []);

  const parts = useMemo(
    () => convertParts(selection.parts, selection.calendar, calendar),
    [selection, calendar],
  );
  const birthDay = partsToDayNumber(parts, calendar);
  const inFuture = birthDay !== null && birthDay > todayDay;
  // Once revealed, the result follows the pickers (and today) live.
  const age = revealed && birthDay !== null && !inFuture ? calculateAge(birthDay, todayDay, calendar) : null;
  const hasInput = parts.year !== '' || parts.month !== '' || parts.day !== '';
  const other = calendar === 'BS' ? 'AD' : 'BS';

  const onPartsChange = (next) => {
    setSelection({ calendar, parts: next });
    setError('');
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!isComplete(parts)) return setError('Choose the year, month and day of birth.');
    if (birthDay === null) return setError("That date doesn't exist in this calendar.");
    if (inFuture) return setError("Date of birth can't be in the future.");
    setError('');
    setRevealed(true);
  };

  const clear = () => {
    setSelection({ calendar, parts: EMPTY_PARTS });
    setRevealed(false);
    setError('');
  };

  return (
    <section
      aria-labelledby="calculator-heading"
      className="rounded-2xl bg-card p-5 shadow-card ring-1 ring-line sm:p-6"
    >
      <h2 id="calculator-heading" className="text-xl leading-tight font-semibold">
        Calculate age
      </h2>
      <p className="mt-1 text-[0.9375rem] text-ink-2">
        Enter a date of birth in {CALENDAR_LABELS[calendar].long} ({calendar}). For {other} dates, use the switch at the
        top.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-5">
        <fieldset>
          <legend className="sr-only">Date of birth in {CALENDAR_LABELS[calendar].long}</legend>
          <DobFields
            idPrefix="calc"
            calendar={calendar}
            value={parts}
            onChange={onPartsChange}
            todayDay={todayDay}
            error={error}
          />
        </fieldset>
        <div className="mt-4 flex gap-2">
          <Button type="submit" size="lg" className="flex-1 sm:flex-none sm:px-7">
            Calculate age
          </Button>
          {hasInput && (
            <Button variant="ghost" size="lg" onClick={clear}>
              Clear
            </Button>
          )}
        </div>
      </form>

      <p className="sr-only" aria-live="polite">
        {age ? `Age: ${formatAge(age)}` : ''}
      </p>

      {age && (
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="mb-3 text-sm font-medium text-ink-2">Age in {CALENDAR_LABELS[calendar].long}</h3>
          <AgeFigure age={age} />
          <AgeDetails birthDay={birthDay} age={age} calendar={calendar} todayDay={todayDay} />
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => setOpenDialog('calendar')}>
              <CalendarDays aria-hidden="true" /> View on calendar
            </Button>
            <Button onClick={() => setOpenDialog('save')}>
              <UserPlus aria-hidden="true" /> Save to family
            </Button>
          </div>
        </div>
      )}

      <CalendarDialog
        open={openDialog === 'calendar'}
        onClose={closeDialog}
        focusDay={birthDay}
        title="Birth date on the calendar"
      />
      <MemberDialog
        open={openDialog === 'save'}
        onClose={closeDialog}
        title="Save to family"
        initialBirth={{ calendar, parts }}
      />
    </section>
  );
}
