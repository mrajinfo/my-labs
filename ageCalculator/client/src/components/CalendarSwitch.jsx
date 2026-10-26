import clsx from 'clsx';
import { CALENDAR_LABELS, CALENDARS } from '@umer/shared';
import { useRef } from 'react';

/**
 * BS / AD segmented control (a radio group: arrow keys move the choice).
 * Used in the header for the whole app, and inside forms for one field.
 */
export function CalendarSwitch({ value, onChange, label = 'Calendar', size = 'md', className }) {
  const buttons = useRef({});

  const onKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const next = value === 'BS' ? 'AD' : 'BS';
    onChange(next);
    buttons.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={clsx('inline-flex rounded-xl bg-ink/[0.06] p-1', className)}
    >
      {CALENDARS.map((option) => {
        const checked = value === option;
        return (
          <button
            key={option}
            ref={(node) => {
              buttons.current[option] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            title={CALENDAR_LABELS[option].long}
            onClick={() => onChange(option)}
            className={clsx(
              'rounded-lg font-semibold transition-[color,background-color,box-shadow]',
              size === 'sm' ? 'h-8 min-w-11 px-2.5 text-sm' : 'h-9 min-w-13 px-3 text-[0.9375rem]',
              checked ? 'bg-card text-brand shadow-sm ring-1 ring-line' : 'text-ink-2 hover:text-ink',
            )}
          >
            {CALENDAR_LABELS[option].short}
            <span className="sr-only"> ({CALENDAR_LABELS[option].long})</span>
          </button>
        );
      })}
    </div>
  );
}
