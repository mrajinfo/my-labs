import { useEffect, useState } from 'react';
import { msUntilNextLocalMidnight, todayDayNumber } from '@umer/shared';
import { TodayContext } from './today.js';

/**
 * Keeps "today" current so every age on screen moves forward at midnight,
 * even if the tab stays open for days. Timers can be paused while a device
 * sleeps, so today is also re-read whenever the page becomes visible again.
 */
export function TodayProvider({ children }) {
  const [today, setToday] = useState(() => todayDayNumber());

  useEffect(() => {
    let timer;

    const refresh = () => setToday(todayDayNumber());

    const scheduleMidnight = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, msUntilNextLocalMidnight() + 500);
    };

    const onWake = () => {
      if (document.visibilityState !== 'visible') return;
      refresh();
      scheduleMidnight();
    };

    scheduleMidnight();
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, []);

  return <TodayContext.Provider value={today}>{children}</TodayContext.Provider>;
}
