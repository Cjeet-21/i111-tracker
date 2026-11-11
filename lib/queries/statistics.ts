import "server-only";

import { prisma } from "@/lib/db";
import {
  addDays,
  endOfPlainDateInTimezone,
  startOfMonth,
  startOfPlainDateInTimezone,
  toPlainDateString,
  todayInTimezone,
} from "@/lib/dates";
import { stageName } from "@/lib/scheduling/engine";
import type { StatisticsView, StageStat, TopicStat } from "@/types";

/** Full statistics page data for a user. */
export async function getStatistics(
  userId: string,
  timezone: string
): Promise<StatisticsView> {
  const today = todayInTimezone(timezone);
  const todayStart = startOfPlainDateInTimezone(timezone, today);
  const tomorrowStart = endOfPlainDateInTimezone(timezone, today);
  const weekStart = startOfPlainDateInTimezone(timezone, addDays(today, -6));
  const monthStart = startOfPlainDateInTimezone(
    timezone,
    startOfMonth(today)
  );
  const todayStr = toPlainDateString(today);

  const [
    totalProblems,
    solvedThisWeek,
    solvedThisMonth,
    revisionsToday,
    revisionsThisWeek,
    revisionsThisMonth,
    activeCycles,
    completedCycles,
    activeProblems,
    topicGroups,
  ] = await Promise.all([
    prisma.problem.count({ where: { userId } }),
    prisma.problem.count({ where: { userId, solvedAt: { gte: weekStart } } }),
    prisma.problem.count({ where: { userId, solvedAt: { gte: monthStart } } }),
    prisma.revisionHistory.count({
      where: { userId, completedAt: { gte: todayStart, lt: tomorrowStart } },
    }),
    prisma.revisionHistory.count({
      where: { userId, completedAt: { gte: weekStart } },
    }),
    prisma.revisionHistory.count({
      where: { userId, completedAt: { gte: monthStart } },
    }),
    prisma.problem.count({ where: { userId, status: "ACTIVE" } }),
    prisma.problem.count({ where: { userId, status: "COMPLETED" } }),
    prisma.problem.findMany({
      where: { userId, status: "ACTIVE" },
      select: { currentStage: true, nextRevisionDate: true },
    }),
    prisma.problem.groupBy({
      by: ["topic"],
      where: { userId, topic: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { topic: "desc" } },
      take: 8,
    }),
  ]);

  let dueToday = 0;
  let overdue = 0;
  const stageCounts = new Map<number, number>();
  for (const problem of activeProblems) {
    stageCounts.set(
      problem.currentStage,
      (stageCounts.get(problem.currentStage) ?? 0) + 1
    );
    const dateStr = toPlainDateString(problem.nextRevisionDate);
    if (dateStr < todayStr) overdue += 1;
    else if (dateStr === todayStr) dueToday += 1;
  }

  const byStage: StageStat[] = [0, 1, 2, 3].map((stage) => ({
    stage,
    stageName: stageName(stage),
    count: stageCounts.get(stage) ?? 0,
  }));

  const topTopics: TopicStat[] = topicGroups.map((group) => ({
    topic: group.topic ?? "Uncategorized",
    count: group._count._all,
  }));

  return {
    totalProblems,
    solvedThisWeek,
    solvedThisMonth,
    revisionsToday,
    revisionsThisWeek,
    revisionsThisMonth,
    activeCycles,
    completedCycles,
    dueToday,
    overdue,
    byStage,
    topTopics,
  };
}
