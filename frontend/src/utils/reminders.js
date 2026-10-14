import { useEffect, useState } from 'react';

/*
 * Browser-notification reminders for saved contests.
 * There is no server push yet, so reminders fire while BRUHCODE is open in a tab.
 */

export const REMINDER_LEAD_MINUTES = 15;

const ENABLED_KEY = 'bc_reminders';
const SENT_KEY = 'bc_reminders_sent';
const listeners = new Set();

const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
  },
};

export const remindersSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export const remindersEnabled = () =>
  remindersSupported() && Notification.permission === 'granted' && storage.get(ENABLED_KEY) === 'on';

const emit = () => listeners.forEach((fn) => fn(remindersEnabled()));

/** Asks for notification permission and turns reminders on. Returns 'granted' | 'denied' | 'default' | 'unsupported'. */
export async function enableReminders() {
  if (!remindersSupported()) return 'unsupported';
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission === 'granted') storage.set(ENABLED_KEY, 'on');
  emit();
  return permission;
}

export function disableReminders() {
  storage.remove(ENABLED_KEY);
  emit();
}

export function useRemindersEnabled() {
  const [enabled, setEnabled] = useState(remindersEnabled);
  useEffect(() => {
    listeners.add(setEnabled);
    return () => listeners.delete(setEnabled);
  }, []);
  return enabled;
}

/* Remember which contests were already announced so a reload doesn't notify twice. */
function sentKeys() {
  try { return new Set(JSON.parse(storage.get(SENT_KEY) || '[]')); } catch { return new Set(); }
}

function markSent(key) {
  const keys = [...sentKeys(), key].slice(-200);
  storage.set(SENT_KEY, JSON.stringify(keys));
}

/**
 * Shows a notification for each contest starting within the lead time that hasn't been announced yet.
 * `onOpen(contest)` runs when the user clicks a notification.
 */
export function notifyUpcoming(contests, onOpen, now = Date.now()) {
  if (!remindersEnabled()) return;
  const sent = sentKeys();
  for (const c of contests) {
    const start = new Date(c.startTime).getTime();
    const minutes = (start - now) / 60_000;
    const key = `${c.id}@${start}`;
    if (minutes <= 0 || minutes > REMINDER_LEAD_MINUTES || sent.has(key)) continue;

    const mins = Math.max(1, Math.round(minutes));
    const notification = new Notification(`${c.name} starts in ${mins} min`, {
      body: `${c.platform} · ${new Date(start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`,
      tag: key,
    });
    notification.onclick = () => {
      window.focus();
      onOpen?.(c);
      notification.close();
    };
    markSent(key);
  }
}
