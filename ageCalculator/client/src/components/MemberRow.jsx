import clsx from 'clsx';
import { Cake, CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { CALENDAR_LABELS, formatAge, formatDate, formatDayMonth, formatDaysUntil, fromDayNumber } from '@umer/shared';
import { avatarTone, initialsOf } from '../lib/members.js';
import { YearProgress } from './AgeDetails.jsx';
import { RowMenu } from './RowMenu.jsx';

function Avatar({ name, className }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'inline-flex size-11 items-center justify-center rounded-full text-[0.9375rem] font-bold',
        avatarTone(name),
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/** "50y 10m 12d" with strong numerals; read out in full by screen readers. */
function CompactAge({ age }) {
  if (!age) return <span className="text-ink-3">Not born yet</span>;
  const part = (value, unit) => (
    <span className="mr-2 whitespace-nowrap last:mr-0">
      <span className="text-lg font-bold tabular-nums [font-stretch:115%]">{value}</span>
      <span className="ml-0.5 text-sm font-medium text-ink-3">{unit}</span>
    </span>
  );
  return (
    <>
      <span className="sr-only">{formatAge(age)}</span>
      <span aria-hidden="true">
        {part(age.years, 'y')}
        {part(age.months, 'm')}
        {part(age.days, 'd')}
      </span>
    </>
  );
}

function BirthdayNote({ age, calendar, compact = false }) {
  const birthday = age?.birthday;
  if (!birthday) return <span className="text-ink-3">—</span>;
  if (age.isBirthdayToday) {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-marigold-ink">
        <Cake aria-hidden="true" className="size-4 text-marigold" /> Turns {birthday.turning} today
      </span>
    );
  }
  const soon = birthday.daysUntil <= 7;
  const when = formatDaysUntil(birthday.daysUntil);
  if (compact) {
    return (
      <span className={clsx(soon && 'font-semibold text-marigold-ink')}>
        Birthday {when}, turns {birthday.turning}
      </span>
    );
  }
  return (
    <>
      <span className={clsx('block first-letter:uppercase', soon ? 'font-semibold text-marigold-ink' : 'text-ink')}>
        {when}
      </span>
      <span className="block text-ink-3">
        {formatDayMonth(birthday.date, calendar, { short: true })}, turns {birthday.turning}
      </span>
    </>
  );
}

export function MemberRow({ row, calendar, highlighted, onView, onEdit, onDelete }) {
  const { member, birth, birthDay, age } = row;
  const other = calendar === 'BS' ? 'AD' : 'BS';
  const birthOther = fromDayNumber(birthDay, other);

  return (
    <li
      id={`member-${member.id}`}
      className={clsx(
        'member-row scroll-mt-24 px-5 py-4 sm:px-6',
        age?.isBirthdayToday && 'bg-marigold-tint/60',
        highlighted && 'animate-flash',
      )}
    >
      <Avatar name={member.name} className="[grid-area:avatar] self-start" />

      <div className="min-w-0 [grid-area:person]">
        <p className="truncate leading-snug font-semibold text-ink">{member.name}</p>
        {member.relation && <p className="truncate text-sm text-ink-2">{member.relation}</p>}
      </div>

      <p className="mt-1 [grid-area:age] @min-[44rem]:mt-0">
        <CompactAge age={age} />
      </p>

      <div className="member-wide text-sm leading-snug [grid-area:born]">
        <p className="text-ink">{formatDate(birth, calendar)}</p>
        <p className="text-ink-3">
          {formatDate(birthOther, other, { short: true })} {CALENDAR_LABELS[other].short}
        </p>
      </div>

      <div className="member-wide text-sm leading-snug [grid-area:birthday]">
        <BirthdayNote age={age} calendar={calendar} />
        {age?.birthday && !age.isBirthdayToday && <YearProgress value={age.yearProgress} className="mt-1.5 w-24" />}
      </div>

      <div className="member-meta-mobile mt-0.5 space-y-0.5 text-sm leading-snug text-ink-2 [grid-area:meta]">
        <p>
          Born {formatDate(birth, calendar)} {CALENDAR_LABELS[calendar].short}
        </p>
        <p>
          <BirthdayNote age={age} calendar={calendar} compact />
        </p>
      </div>

      <div className="-mr-2 self-start justify-self-end [grid-area:menu] @min-[44rem]:self-center">
        <RowMenu
          label={`Options for ${member.name}`}
          items={[
            { label: 'View on calendar', icon: CalendarDays, onSelect: () => onView(row) },
            { label: 'Edit', icon: Pencil, onSelect: () => onEdit(member) },
            { label: 'Delete', icon: Trash2, onSelect: () => onDelete(member), danger: true },
          ]}
        />
      </div>
    </li>
  );
}
