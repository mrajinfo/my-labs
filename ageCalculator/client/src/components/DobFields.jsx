import { useMemo } from 'react';
import { dayOptions, monthOptions, tidyParts, yearOptions } from '../lib/dates.js';
import { SelectField } from './ui/Fields.jsx';

/**
 * Year / month / day selects for a birth date in either calendar.
 * Month and day lists follow the real calendar (29–32 day BS months, leap
 * years in AD), and anything after today is disabled.
 */
export function DobFields({ idPrefix, calendar, value, onChange, todayDay, error }) {
  const years = useMemo(() => yearOptions(calendar, todayDay), [calendar, todayDay]);
  const months = monthOptions(calendar, value.year, todayDay);
  const days = dayOptions(calendar, value.year, value.month, todayDay);

  const setPart = (key, raw) => {
    const next = { ...value, [key]: raw === '' ? '' : Number(raw) };
    onChange(tidyParts(next, calendar, todayDay));
  };

  const errorId = `${idPrefix}-dob-error`;
  const fieldProps = (part) => ({
    id: `${idPrefix}-${part}`,
    value: value[part],
    onChange: (raw) => setPart(part, raw),
    describedBy: error ? errorId : undefined,
    // When something is missing, point at the empty selects; otherwise (e.g. a
    // future date) the message alone explains it.
    invalid: Boolean(error) && value[part] === '',
  });

  return (
    <div className="@container">
      <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7.4fr)_minmax(0,4.6fr)] gap-2.5 @max-[18rem]:grid-cols-[minmax(0,1fr)_5.5rem] sm:gap-3">
        <SelectField label="Year" className="@max-[18rem]:col-span-2" {...fieldProps('year')}>
          <option value="">Year</option>
          {years.map((year) => (
            <option key={year} value={year} className="text-ink">
              {year}
            </option>
          ))}
        </SelectField>
        <SelectField label="Month" {...fieldProps('month')}>
          <option value="">Month</option>
          {months.map((month) => (
            <option key={month.value} value={month.value} disabled={month.disabled} className="text-ink">
              {month.label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Day" {...fieldProps('day')}>
          <option value="">Day</option>
          {days.map((day) => (
            <option key={day.value} value={day.value} disabled={day.disabled} className="text-ink">
              {day.value}
            </option>
          ))}
        </SelectField>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-crimson">
          {error}
        </p>
      )}
    </div>
  );
}
