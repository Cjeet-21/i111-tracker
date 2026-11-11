import "server-only";

import { prisma } from "@/lib/db";
import {
  parsePlainDateInput,
  toPlainDateString,
  todayInTimezone,
} from "@/lib/dates";
import { stageName } from "@/lib/scheduling/engine";
import { toProblemListItem } from "@/lib/queries/mappers";
import type { RevisionQueueItem } from "@/types";

/**
 * Everything due today or overdue, most overdue first, then today's items
 * ordered by title. Overdue revisions always stay in the queue.
 */
export async function getRevisionQueue(
  userId: string,
  timezone: string
): Promise<{ items: RevisionQueueItem[]; today: string }> {
  const today = todayInTimezone(timezone);
  const todayStr = toPlainDateString(today);

  const problems = await prisma.problem.findMany({
    where: {
      userId,
      status: "ACTIVE",
      nextRevisionDate: { lte: today },
    },
    orderBy: [{ nextRevisionDate: "asc" }, { title: "asc" }],
  });

  const items: RevisionQueueItem[] = problems.map((problem) => ({
    ...toProblemListItem(problem, today),
    description: problem.description,
    scheduledDate: toPlainDateString(problem.nextRevisionDate),
    stageName: stageName(problem.currentStage),
  }));

  return { items, today: todayStr };
}

/** Problems scheduled for a specific calendar date (active cycles only). */
export async function getProblemsScheduledOn(
  userId: string,
  dateStr: string
): Promise<RevisionQueueItem[]> {
  const date = parsePlainDateInput(dateStr);
  const problems = await prisma.problem.findMany({
    where: {
      userId,
      status: "ACTIVE",
      nextRevisionDate: date,
    },
    orderBy: { title: "asc" },
  });
  return problems.map((problem) => ({
    ...toProblemListItem(problem, date),
    description: problem.description,
    scheduledDate: toPlainDateString(problem.nextRevisionDate),
    stageName: stageName(problem.currentStage),
    dueToday: true,
    overdueBy: 0,
  }));
}
