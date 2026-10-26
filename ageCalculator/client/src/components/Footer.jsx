import { SUPPORTED_RANGE } from '@umer/shared';

export function Footer() {
  const { BS, AD } = SUPPORTED_RANGE;
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-6 text-sm text-ink-2 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p>Ages use today&apos;s date on this device and move forward at midnight.</p>
        <p>
          Works for {BS.min.year}–{BS.max.year} BS ({AD.min.year}–{AD.max.year} AD).
        </p>
      </div>
    </footer>
  );
}
