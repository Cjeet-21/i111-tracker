import type { Difficulty as PrismaDifficulty, Problem } from "@prisma/client";
import { toPlainDateString } from "@/lib/dates";
import { daysOverdue, isDueOnOrBefore, stageName } from "@/lib/scheduling/engine";
import type { Difficulty, ProblemListItem } from "@/types";

export function toDifficulty(
  value: PrismaDifficulty | null
): Difficulty | null {
  return (value as Difficulty | null) ?? null;
}

/** Map a Problem row to a UI-ready list item. `today` is a plain date. */
export function toProblemListItem(
  problem: Problem,
  today: Date
): ProblemListItem {
  const overdueBy = daysOverdue(problem.nextRevisionDate, today);
  const dueToday = isDueOnOrBefore(problem.nextRevisionDate, today);
  return {
    id: problem.id,
    title: problem.title,
    url: problem.url,
    topic: problem.topic,
    difficulty: toDifficulty(problem.difficulty),
    solvedAt: toPlainDateString(problem.solvedAt),
    currentStage: problem.currentStage,
    stageName: stageName(problem.currentStage),
    nextRevisionDate:
      problem.status === "COMPLETED"
        ? null
        : toPlainDateString(problem.nextRevisionDate),
    status: problem.status,
    overdueBy,
    dueToday,
  };
}
