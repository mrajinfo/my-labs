import { useCallback, useMemo, useState } from 'react';
import { CalendarModeContext } from './calendarMode.js';

const STORAGE_KEY = 'umer:calendar';

function readStoredCalendar() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'AD' ? 'AD' : 'BS';
  } catch {
    return 'BS';
  }
}

export function CalendarModeProvider({ children }) {
  const [calendar, setCalendarState] = useState(readStoredCalendar);

  const setCalendar = useCallback((next) => {
    setCalendarState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing or storage disabled: the choice just won't persist.
    }
  }, []);

  const value = useMemo(() => ({ calendar, setCalendar }), [calendar, setCalendar]);
  return <CalendarModeContext.Provider value={value}>{children}</CalendarModeContext.Provider>;
}
