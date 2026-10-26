import { createContext, useContext } from 'react';

/** @type {import('react').Context<{ calendar: 'BS' | 'AD', setCalendar: (next: 'BS' | 'AD') => void } | null>} */
export const CalendarModeContext = createContext(null);

/** The calendar the whole app shows dates and ages in, chosen in the header. */
export function useCalendarMode() {
  const context = useContext(CalendarModeContext);
  if (!context) throw new Error('useCalendarMode must be used inside <CalendarModeProvider>');
  return context;
}
