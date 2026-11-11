import "server-only";

import { prisma } from "@/lib/db";
import {
  addDays,
  endOfPlainDateInTimezone,
  formatLongDate,
  startOfMonth,
  startOfPlainDateInTimezone,
  toPlainDateString,
  todayInTimezone,
} from "@/lib/dates";
import type { DashboardStats } from "@/types";

/**
 * Dashboard statistics for a user.
 * "Today" is computed in the user's time zone; "this week" = the last 7
 * calendar days including today; "this month" = the current calendar month.
 */
export async function getDashboardStats(
  userId: string,
  timezone: string
): Promise<DashboardStats> {
  const today = todayInTimezone(timezone);
  const todayStart = startOfPlainDateInTimezone(timezone, today);
  const tomorrowStart = endOfPlainDateInTimezone(timezone, today);
  const weekStart = startOfPlainDateInTimezone(
    timezone,
    addDays(today, -6)
  );
  const monthStart = startOfPlainDateInTimezone(
    timezone,
    startOfMonth(today)
  );

  const [
    totalProblems,
    activeProblems,
    completedCycles,
    solvedThisWeek,
    solvedThisMonth,
    revisionsToday,
    revisionsThisWeek,
    revisionsThisMonth,
  ] = await Promise.all([
    prisma.problem.count({ where: { userId } }),
    prisma.problem.findMany({
      where: { userId, status: "ACTIVE" },
      select: { nextRevisionDate: true },
    }),
    prisma.problem.count({ where: { userId, status: "COMPLETED" } }),
    prisma.problem.count({
      where: { userId, solvedAt: { gte: weekStart } },
    }),
    prisma.problem.count({
      where: { userId, solvedAt: { gte: monthStart } },
    }),
    prisma.revisionHistory.count({
      where: { userId, completedAt: { gte: todayStart, lt: tomorrowStart } },
    }),
    prisma.revisionHistory.count({
      where: { userId, completedAt: { gte: weekStart } },
    }),
    prisma.revisionHistory.count({
      where: { userId, completedAt: { gte: monthStart } },
    }),
  ]);

  const todayStr = toPlainDateString(today);
  let dueToday = 0;
  let overdue = 0;
  let activeCycles = 0;
  for (const problem of activeProblems) {
    activeCycles += 1;
    const dateStr = toPlainDateString(problem.nextRevisionDate);
    if (dateStr < todayStr) overdue += 1;
    else if (dateStr === todayStr) dueToday += 1;
  }

  return {
    today: todayStr,
    todayLong: formatLongDate(today),
    dueToday,
    overdue,
    totalProblems,
    solvedThisWeek,
    solvedThisMonth,
    activeCycles,
    completedCycles,
    revisionsToday,
    revisionsThisWeek,
    revisionsThisMonth,
  };
}
