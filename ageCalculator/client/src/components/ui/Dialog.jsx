import clsx from 'clsx';
import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { IconButton } from './Button.jsx';

/**
 * Modal built on the native <dialog>: focus is trapped and Escape closes it
 * for free. Children only render while open, so forms start fresh each time.
 * Renders as a bottom sheet on phones and a centred card from 640px.
 *
 * Put content in <DialogBody> (scrolls) and actions in <DialogFooter> (stays put).
 * Mark the field to focus first with `data-autofocus`.
 */
export function Dialog({ open, onClose, title, description, width = '32rem', children }) {
  const ref = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // React's autoFocus runs before the dialog is shown, so focus here instead.
      dialog.querySelector('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Escape fires "cancel": let React state decide instead of closing directly.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    const handleCancel = (event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  // A press that starts and ends on the backdrop closes the dialog.
  const pressStartedOnBackdrop = useRef(false);
  const onPointerDown = (event) => {
    pressStartedOnBackdrop.current = event.target === ref.current;
  };
  const onClick = (event) => {
    if (pressStartedOnBackdrop.current && event.target === ref.current) onClose();
    pressStartedOnBackdrop.current = false;
  };

  return (
    <dialog
      ref={ref}
      className="dialog"
      style={{ '--dialog-width': width }}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {open && (
        <>
          <div className="flex shrink-0 items-start gap-3 px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-xl leading-tight font-semibold text-ink">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-[0.9375rem] text-ink-2">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Close" onClick={onClose} className="-mt-1.5 -mr-2">
              <X />
            </IconButton>
          </div>
          {children}
        </>
      )}
    </dialog>
  );
}

export function DialogBody({ className, children }) {
  return <div className={clsx('min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6', className)}>{children}</div>;
}

export function DialogFooter({ children }) {
  return (
    <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line bg-paper/70 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
      {children}
    </div>
  );
}
