import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { notifyUpcoming, useRemindersEnabled } from '../utils/reminders';

const REFRESH_SAVED_MS = 5 * 60_000;
const CHECK_MS = 30_000;

/* Watches the user's saved contests and shows a notification shortly before each one starts. */
export default function ReminderService() {
  const { isAuthenticated } = useAuth();
  const enabled = useRemindersEnabled();
  const navigate = useNavigate();
  const saved = useRef([]);

  useEffect(() => {
    if (!isAuthenticated || !enabled) return undefined;

    const openContest = (c) => navigate(`/contest/${c.id}`);
    const check = () => notifyUpcoming(saved.current, openContest);
    const refresh = () =>
      userAPI.getSavedContests()
        .then(({ data }) => {
          saved.current = data.map((item) => item.contest).filter(Boolean);
          check();
        })
        .catch(() => {});

    refresh();
    const refreshTimer = setInterval(refresh, REFRESH_SAVED_MS);
    const checkTimer = setInterval(check, CHECK_MS);
    return () => {
      clearInterval(refreshTimer);
      clearInterval(checkTimer);
    };
  }, [isAuthenticated, enabled, navigate]);

  return null;
}
