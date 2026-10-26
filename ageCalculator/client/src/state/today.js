import { createContext, useContext } from 'react';

/** Today's day number (days since 1970-01-01) on this device. */
export const TodayContext = createContext(null);

export function useToday() {
  const today = useContext(TodayContext);
  if (today === null) throw new Error('useToday must be used inside <TodayProvider>');
  return today;
}
