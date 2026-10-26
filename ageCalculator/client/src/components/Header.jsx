import { useCalendarMode } from '../state/calendarMode.js';
import { CalendarSwitch } from './CalendarSwitch.jsx';
import { Logo } from './Logo.jsx';

export function Header() {
  const { calendar, setCalendar } = useCalendarMode();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-md supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex min-w-0 items-center gap-3 rounded-lg">
          <Logo className="size-9 shrink-0" />
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="text-[1.375rem] leading-none font-bold tracking-tight [font-stretch:112%]">Umer</span>
            <span lang="ne" className="text-lg leading-none font-semibold text-crimson">
              उमेर
            </span>
            <span className="hidden truncate border-l border-line-strong pl-2.5 text-sm text-ink-2 sm:inline">
              Nepali age calculator
            </span>
          </span>
        </a>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="hidden text-sm text-ink-2 md:inline">
            Show dates in
          </span>
          <CalendarSwitch value={calendar} onChange={setCalendar} label="Show dates in" />
        </div>
      </div>
    </header>
  );
}
