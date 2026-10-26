import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

const CONTROL =
  'h-12 w-full rounded-xl border bg-card text-base text-ink transition-[border-color,box-shadow] ' +
  'focus:border-brand focus:outline-none focus-visible:outline-none focus:ring-4 focus:ring-brand/15';

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-crimson">
      {children}
    </p>
  );
}

/**
 * @param {object} props
 * @param {string} [props.error]       message shown under this field
 * @param {boolean} [props.invalid]    mark as invalid when the message lives elsewhere (e.g. a field group)
 * @param {string} [props.describedBy] id of that external message
 */
export function SelectField({
  id,
  label,
  value,
  onChange,
  error,
  invalid = false,
  describedBy,
  className,
  hideLabel = false,
  children,
  ...props
}) {
  const errorId = `${id}-error`;
  const isInvalid = Boolean(error) || invalid;
  return (
    <div className={className}>
      <label htmlFor={id} className={clsx('mb-1.5 block text-sm font-medium text-ink-2', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={isInvalid ? true : undefined}
          aria-describedby={error ? errorId : describedBy}
          className={clsx(
            CONTROL,
            'cursor-pointer appearance-none truncate pr-8 pl-3',
            isInvalid ? 'border-crimson' : 'border-line-strong hover:border-ink-3',
            value === '' && 'text-ink-3',
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-3"
        />
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

export function TextField({ id, label, value, onChange, error, hint, className, ...props }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-2">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={clsx(
          CONTROL,
          'px-3.5 placeholder:text-ink-3',
          error ? 'border-crimson' : 'border-line-strong hover:border-ink-3',
        )}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-ink-3">
          {hint}
        </p>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
