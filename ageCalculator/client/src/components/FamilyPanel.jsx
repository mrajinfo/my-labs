import clsx from 'clsx';
import { Cake, CloudOff, Plus, RotateCw, Search, UsersRound, X } from 'lucide-react';
import { formatDate, formatDaysUntil, plural } from '@umer/shared';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useDeleteMember, useMembers } from '../hooks/useMembers.js';
import { SORT_OPTIONS, buildRows, nextBirthdayRow } from '../lib/members.js';
import { useCalendarMode } from '../state/calendarMode.js';
import { useHighlightedMember } from '../state/highlight.js';
import { useToday } from '../state/today.js';
import { CalendarDialog } from './CalendarDialog.jsx';
import { ConfirmDialog } from './ConfirmDialog.jsx';
import { MemberDialog } from './MemberDialog.jsx';
import { MemberRow } from './MemberRow.jsx';
import { Button } from './ui/Button.jsx';
import { SelectField } from './ui/Fields.jsx';

const SORT_KEY = 'umer:sort';

function readStoredSort() {
  try {
    const stored = localStorage.getItem(SORT_KEY);
    return SORT_OPTIONS.some((option) => option.value === stored) ? stored : 'birthday';
  } catch {
    return 'birthday';
  }
}

function UpcomingBirthday({ row, calendar }) {
  if (!row || row.age.birthday.daysUntil > 30) return null;
  const { birthday } = row.age;
  return (
    <div className="mx-5 mt-4 flex items-start gap-3 rounded-xl bg-marigold-tint px-4 py-3 text-marigold-ink sm:mx-6">
      <Cake aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marigold" />
      <p className="text-[0.9375rem] leading-snug">
        {birthday.daysUntil === 0 ? (
          <>
            It&apos;s <strong className="font-semibold">{row.member.name}</strong>&apos;s birthday today. They turn{' '}
            {birthday.turning}.
          </>
        ) : (
          <>
            <strong className="font-semibold">{row.member.name}</strong> turns {birthday.turning}{' '}
            {formatDaysUntil(birthday.daysUntil)}, on {formatDate(birthday.date, calendar, { short: calendar === 'AD' })}.
          </>
        )}
      </p>
    </div>
  );
}

function StateMessage({ icon: Icon, title, children, action, tone = 'neutral' }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center" role={tone === 'error' ? 'alert' : undefined}>
      <span
        aria-hidden="true"
        className={clsx(
          'mb-4 inline-flex size-12 items-center justify-center rounded-full',
          tone === 'error' ? 'bg-crimson-tint text-crimson' : 'bg-brand-tint text-brand',
        )}
      >
        <Icon className="size-6" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-[0.9375rem] text-ink-2">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function SkeletonRows() {
  return (
    <ul aria-hidden="true" className="divide-y divide-line">
      {[0, 1, 2].map((key) => (
        <li key={key} className="flex items-center gap-4 px-5 py-5 sm:px-6">
          <span className="size-11 animate-pulse rounded-full bg-ink/[0.07]" />
          <span className="flex-1 space-y-2">
            <span className="block h-4 w-1/3 animate-pulse rounded bg-ink/[0.07]" />
            <span className="block h-3 w-1/2 animate-pulse rounded bg-ink/[0.05]" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function FamilyPanel() {
  const { calendar } = useCalendarMode();
  const todayDay = useToday();
  const { data: members = [], isPending, isError, error, refetch, isRefetching } = useMembers();
  const deleteMember = useDeleteMember();
  const highlightedId = useHighlightedMember();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(readStoredSort);
  const [editing, setEditing] = useState(null); // { member } — member is null when adding
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);

  const rows = useMemo(
    () => buildRows(members, { todayDay, calendar, query, sort }),
    [members, todayDay, calendar, query, sort],
  );
  const soonest = useMemo(() => nextBirthdayRow(members, todayDay, calendar), [members, todayDay, calendar]);

  const changeSort = (value) => {
    setSort(value);
    try {
      localStorage.setItem(SORT_KEY, value);
    } catch {
      // Not persisted; fine.
    }
  };

  const closeEditor = useCallback(() => setEditing(null), []);
  const closeDelete = useCallback(() => setDeleting(null), []);
  const closeViewer = useCallback(() => setViewing(null), []);

  const confirmDelete = () => {
    const member = deleting;
    setDeleting(null);
    deleteMember.mutate(member.id, {
      onSuccess: () => toast.success(`Deleted ${member.name}`),
      onError: (err) => toast.error(`Couldn't delete ${member.name}`, { description: err.message }),
    });
  };

  const addButton = (
    <Button onClick={() => setEditing({ member: null })}>
      <Plus aria-hidden="true" /> Add member
    </Button>
  );

  let body;
  if (isPending) {
    body = <SkeletonRows />;
  } else if (isError) {
    body = (
      <StateMessage
        icon={CloudOff}
        tone="error"
        title="Couldn't load your family"
        action={
          <Button variant="secondary" onClick={() => refetch()} disabled={isRefetching}>
            <RotateCw aria-hidden="true" className={clsx(isRefetching && 'animate-spin')} /> Try again
          </Button>
        }
      >
        {error.message}
      </StateMessage>
    );
  } else if (members.length === 0) {
    body = (
      <StateMessage icon={UsersRound} title="No one saved yet" action={addButton}>
        Save a family member with their date of birth, and their age will stay here, updated every day.
      </StateMessage>
    );
  } else if (rows.length === 0) {
    body = (
      <StateMessage
        icon={Search}
        title={`No one matches “${query.trim()}”`}
        action={
          <Button variant="secondary" onClick={() => setQuery('')}>
            Clear search
          </Button>
        }
      >
        Search looks at names and relations.
      </StateMessage>
    );
  } else {
    body = (
      <div className="member-list">
        <div
          aria-hidden="true"
          className="member-columns border-b border-line px-5 py-2.5 text-[0.8125rem] font-medium text-ink-3 sm:px-6"
        >
          <span className="[grid-column:1/3]">Name</span>
          <span className="[grid-area:age]">Age</span>
          <span className="[grid-area:born]">Born</span>
          <span className="[grid-area:birthday]">Next birthday</span>
        </div>
        <ul className="divide-y divide-line" aria-label="Family members">
          {rows.map((row) => (
            <MemberRow
              key={row.member.id}
              row={row}
              calendar={calendar}
              highlighted={row.member.id === highlightedId}
              onView={setViewing}
              onEdit={(member) => setEditing({ member })}
              onDelete={setDeleting}
            />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section
      id="family"
      aria-labelledby="family-heading"
      className="scroll-mt-20 rounded-2xl bg-card pb-2 shadow-card ring-1 ring-line"
    >
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 id="family-heading" className="text-xl leading-tight font-semibold">
            Family
          </h2>
          {members.length > 0 && addButton}
        </div>
        <p className="mt-1 text-[0.9375rem] text-ink-2 sm:-mt-1">
          {members.length > 0
            ? `${plural(members.length, 'person', 'people')}. Ages move forward on their own every day.`
            : 'Saved ages move forward on their own every day.'}
        </p>
      </div>

      <UpcomingBirthday row={soonest} calendar={calendar} />

      {members.length > 1 && (
        <div className="mt-4 flex flex-col gap-2.5 px-5 sm:flex-row sm:px-6">
          <div className="relative flex-1">
            <label htmlFor="family-search" className="sr-only">
              Search family
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3"
            />
            <input
              id="family-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search family"
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-line-strong bg-card pr-10 pl-10 text-base placeholder:text-ink-3 hover:border-ink-3 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-3 hover:bg-ink/5 hover:text-ink"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
          <SelectField
            id="family-sort"
            label="Sort by"
            hideLabel
            value={sort}
            onChange={changeSort}
            className="sm:w-52 [&_select]:h-11"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </SelectField>
        </div>
      )}

      <div className="mt-3">{body}</div>

      <MemberDialog open={editing !== null} onClose={closeEditor} member={editing?.member ?? null} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title={deleting ? `Delete ${deleting.name}?` : ''}
        description="Their saved date of birth will be removed. This can't be undone."
        confirmLabel="Delete"
      />
      <CalendarDialog
        open={viewing !== null}
        onClose={closeViewer}
        focusDay={viewing?.birthDay ?? null}
        title={viewing ? `${viewing.member.name}'s birth date` : 'Calendar'}
      />
    </section>
  );
}
