import { NAME_MAX_LENGTH, RELATIONS, formatIsoDate, parseIsoDate } from '@umer/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateMember, useUpdateMember } from '../hooks/useMembers.js';
import { EMPTY_PARTS, convertParts, isComplete, partsToDayNumber } from '../lib/dates.js';
import { useCalendarMode } from '../state/calendarMode.js';
import { highlightMember } from '../state/highlight.js';
import { useToday } from '../state/today.js';
import { CalendarSwitch } from './CalendarSwitch.jsx';
import { DobFields } from './DobFields.jsx';
import { Button } from './ui/Button.jsx';
import { Dialog, DialogBody, DialogFooter } from './ui/Dialog.jsx';
import { SelectField, TextField } from './ui/Fields.jsx';

function initialForm(member, initialBirth, appCalendar) {
  if (member) {
    const calendar = member.enteredIn;
    return {
      name: member.name,
      relation: member.relation,
      calendar,
      parts: parseIsoDate(calendar === 'BS' ? member.dob.bs : member.dob.ad),
    };
  }
  return {
    name: '',
    relation: '',
    calendar: initialBirth?.calendar ?? appCalendar,
    parts: initialBirth?.parts ?? EMPTY_PARTS,
  };
}

function scrollToMember(id) {
  document.getElementById(`member-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function MemberForm({ member, initialBirth, onDone, onCancel }) {
  const { calendar: appCalendar } = useCalendarMode();
  const todayDay = useToday();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const [form, setForm] = useState(() => initialForm(member, initialBirth, appCalendar));
  const [errors, setErrors] = useState({});
  const pending = createMember.isPending || updateMember.isPending;

  const update = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors((current) => ({ ...current, ...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])) }));
  };

  const switchCalendar = (next) => {
    setForm((current) => ({ ...current, calendar: next, parts: convertParts(current.parts, current.calendar, next) }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter a name.';
    const birthDay = partsToDayNumber(form.parts, form.calendar);
    if (!isComplete(form.parts)) next.parts = 'Choose the year, month and day of birth.';
    else if (birthDay === null) next.parts = "That date doesn't exist in this calendar.";
    else if (birthDay > todayDay) next.parts = "Date of birth can't be in the future.";
    return next;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const input = {
      name: form.name.trim(),
      relation: form.relation,
      calendar: form.calendar,
      dob: formatIsoDate(form.parts),
    };
    try {
      const saved = member
        ? await updateMember.mutateAsync({ id: member.id, input })
        : await createMember.mutateAsync(input);
      highlightMember(saved.id);
      if (member) {
        toast.success(`Updated ${saved.name}`);
      } else {
        toast.success(`Saved ${saved.name} to your family`, {
          description: 'Their age will now update every day.',
          action: { label: 'Show', onClick: () => scrollToMember(saved.id) },
        });
      }
      onDone();
    } catch (error) {
      const fields = error.fieldErrors ?? {};
      setErrors({
        name: fields.name,
        relation: fields.relation,
        parts: fields.dob ?? fields.calendar,
        form: Object.keys(fields).length > 0 ? undefined : error.message,
      });
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="space-y-5">
        <TextField
          id="member-name"
          label="Name"
          value={form.name}
          onChange={(name) => update({ name })}
          error={errors.name}
          placeholder="e.g. Aama, Sita Sharma"
          autoComplete="off"
          maxLength={NAME_MAX_LENGTH}
          data-autofocus
        />
        <SelectField
          id="member-relation"
          label="Relation (optional)"
          value={form.relation}
          onChange={(relation) => update({ relation })}
          error={errors.relation}
        >
          <option value="">Not set</option>
          {RELATIONS.map((relation) => (
            <option key={relation} value={relation} className="text-ink">
              {relation}
            </option>
          ))}
        </SelectField>
        <div role="group" aria-labelledby="member-dob-label">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span id="member-dob-label" className="text-sm font-medium text-ink-2">
              Date of birth
            </span>
            <CalendarSwitch size="sm" value={form.calendar} onChange={switchCalendar} label="Date of birth calendar" />
          </div>
          <DobFields
            idPrefix="member"
            calendar={form.calendar}
            value={form.parts}
            onChange={(parts) => update({ parts })}
            todayDay={todayDay}
            error={errors.parts}
          />
        </div>
        {errors.form && (
          <p role="alert" className="rounded-xl bg-crimson-tint px-4 py-3 text-[0.9375rem] text-crimson-strong">
            {errors.form}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : member ? 'Save changes' : 'Save member'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Add or edit a family member.
 * @param {{ open: boolean, onClose: () => void, member?: object | null,
 *           initialBirth?: { calendar: 'BS' | 'AD', parts: object }, title?: string }} props
 */
export function MemberDialog({ open, onClose, member = null, initialBirth, title }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title ?? (member ? `Edit ${member.name}` : 'Add family member')}
      description={member ? undefined : 'Their age is worked out fresh every day, so it never goes stale.'}
    >
      <MemberForm member={member} initialBirth={initialBirth} onDone={onClose} onCancel={onClose} />
    </Dialog>
  );
}
