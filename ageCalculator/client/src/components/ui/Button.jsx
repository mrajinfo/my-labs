import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-brand text-white shadow-[0_1px_0_rgb(255_255_255/0.15)_inset] hover:bg-brand-strong',
  secondary: 'bg-card text-ink ring-1 ring-inset ring-line-strong hover:bg-paper hover:ring-ink-3',
  ghost: 'text-ink-2 hover:bg-ink/5 hover:text-ink',
  danger: 'bg-crimson text-white hover:bg-crimson-strong',
};

const SIZES = {
  sm: 'h-9 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-11 gap-2 rounded-xl px-4 text-[0.9375rem]',
  lg: 'h-12 gap-2 rounded-xl px-5 text-base',
};

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-colors select-none',
        'disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:size-[1.15em] [&_svg]:shrink-0',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}

/** Square icon-only button. `label` is required: it is the accessible name. */
export function IconButton({ label, className, type = 'button', children, ...props }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-ink-2 transition-colors',
        'hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-5',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
