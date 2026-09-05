import type { SessionSummary } from '../types/session';

export interface MonthlyHoursPoint {
  month: string;
  hours: number;
  isCurrent?: boolean;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Calculates a 12-month array of study hours by summing estimated & actual duration
 * for all learner sessions per calendar month.
 * - For completed sessions: uses (completedAt - startedAt) or baseline 0.35h (20 mins).
 * - For draft/in-progress sessions: uses baseline 0.35h (20 mins) per study module.
 */
export function monthlyHours(sessions: SessionSummary[]): MonthlyHoursPoint[] {
  const currentMonthIdx = new Date().getMonth();

  const result: MonthlyHoursPoint[] = MONTH_NAMES.map((name, idx) => ({
    month: name,
    hours: 0,
    isCurrent: idx === currentMonthIdx,
  }));

  for (const s of sessions) {
    if (!s.startedAt) continue;

    let durationHours = 0.35; // Baseline ~20 mins active AI study time per session

    if (s.completedAt) {
      const start = new Date(s.startedAt).getTime();
      const end = new Date(s.completedAt).getTime();
      const diffHours = (end - start) / (1000 * 60 * 60);
      durationHours = Math.max(0.35, Number(diffHours.toFixed(1)));
    }

    const startDate = new Date(s.startedAt);
    const monthIdx = startDate.getMonth();

    if (monthIdx >= 0 && monthIdx < 12) {
      result[monthIdx].hours = Number((result[monthIdx].hours + durationHours).toFixed(1));
    }
  }

  return result;
}

/**
 * Calculates current streak: consecutive calendar days with lesson creation/study activity,
 * counting backwards from today (or yesterday if no session today yet).
 */
export function currentStreak(sessions: SessionSummary[]): number {
  const activeDates = new Set<string>();

  for (const s of sessions) {
    const timestamp = s.completedAt || s.startedAt;
    if (timestamp) {
      const dateStr = new Date(timestamp).toISOString().split('T')[0];
      activeDates.add(dateStr);
    }
  }

  if (activeDates.size === 0) return 0;

  const today = new Date();
  let checkDate = new Date(today);

  // If today has no activity, check if yesterday had activity
  const todayStr = checkDate.toISOString().split('T')[0];
  if (!activeDates.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];
    if (!activeDates.has(yesterdayStr)) {
      return 0;
    }
  }

  let streak = 0;
  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (activeDates.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
