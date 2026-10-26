import { useSyncExternalStore } from 'react';

/**
 * Remembers the member that was just saved, so their row in the family list
 * can flash briefly — wherever they were saved from.
 */
let highlightedId = null;
let clearTimer;
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener());

export function highlightMember(id) {
  highlightedId = id;
  clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    highlightedId = null;
    emit();
  }, 2500);
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHighlightedMember() {
  return useSyncExternalStore(subscribe, () => highlightedId);
}
