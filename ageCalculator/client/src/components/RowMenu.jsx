import clsx from 'clsx';
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

/**
 * A small "…" actions menu. Arrow keys move between items, Escape closes and
 * returns focus to the button, clicking elsewhere closes it.
 * @param {{ label: string, items: { label: string, icon: Function, onSelect: () => void, danger?: boolean }[] }} props
 */
export function RowMenu({ label, items }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();

    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const onMenuKeyDown = (event) => {
    const options = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
    const index = options.indexOf(document.activeElement);
    const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: options.length - 1 };
    if (event.key in moves) {
      event.preventDefault();
      options[(moves[event.key] + options.length) % options.length]?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={clsx(
          'inline-flex size-10 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink',
          open && 'bg-ink/5 text-ink',
        )}
      >
        <MoreHorizontal aria-hidden="true" className="size-5" />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="absolute top-full right-0 z-20 mt-1 w-52 rounded-xl bg-card p-1.5 shadow-pop ring-1 ring-line"
        >
          {items.map(({ label: itemLabel, icon: Icon, onSelect, danger }) => (
            <button
              key={itemLabel}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                onSelect();
              }}
              className={clsx(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[0.9375rem] outline-none',
                danger
                  ? 'text-crimson hover:bg-crimson-tint focus:bg-crimson-tint'
                  : 'text-ink hover:bg-paper focus:bg-paper',
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
