import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  daysBetween,
  formatInstant,
  parsePlainDateInput,
  toPlainDateString,
  todayInTimezone,
} from "@/lib/dates";
import { stageName } from "@/lib/scheduling/engine";
import { toProblemListItem } from "@/lib/queries/mappers";
import type {
  ProblemDetail,
  ProblemListItem,
  RevisionHistoryItem,
} from "@/types";

export interface ProblemFilters {
  q?: string;
  topic?: string;
  difficulty?: string;
  status?: string;
  stage?: string;
  due?: string;
}

export interface ProblemListResult {
  items: ProblemListItem[];
  topics: string[];
  totalCount: number;
}

function buildWhere(
  userId: string,
  filters: ProblemFilters,
  timezone: string
): Prisma.ProblemWhereInput {
  const where: Prisma.ProblemWhereInput = { userId };

  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { topic: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.topic && filters.topic !== "all") {
    where.topic = { equals: filters.topic, mode: "insensitive" };
  }

  if (
    filters.difficulty === "EASY" ||
    filters.difficulty === "MEDIUM" ||
    filters.difficulty === "HARD"
  ) {
    where.difficulty = filters.difficulty;
  }

  if (filters.status === "ACTIVE" || filters.status === "COMPLETED") {
    where.status = filters.status;
  }

  if (filters.stage !== undefined && filters.stage !== "" && filters.stage !== "all") {
    const stage = Number(filters.stage);
    if (Number.isInteger(stage) && stage >= 0 && stage <= 4) {
      where.currentStage = stage;
    }
  }

  if (filters.due && filters.due !== "all") {
    const today = todayInTimezone(timezone);
    if (filters.due === "today") {
      where.nextRevisionDate = { lte: today };
      where.status = "ACTIVE";
    } else if (filters.due === "overdue") {
      const yesterday = new Date(today.getTime() - 86_400_000);
      where.nextRevisionDate = { lte: yesterday };
      where.status = "ACTIVE";
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(filters.due)) {
      where.nextRevisionDate = parsePlainDateInput(filters.due);
      where.status = "ACTIVE";
    }
  }

  return where;
}

/**
 * Search/filter the problem library. Because `where.userId` is always set,
 * a user can never see another user's problems.
 */
export async function listProblems(
  userId: string,
  filters: ProblemFilters,
  timezone: string
): Promise<ProblemListResult> {
  const where = buildWhere(userId, filters, timezone);
  const today = todayInTimezone(timezone);

  const [problems, topics, totalCount] = await Promise.all([
    prisma.problem.findMany({
      where,
      orderBy: [{ nextRevisionDate: "asc" }, { solvedAt: "desc" }],
    }),
    prisma.problem.findMany({
      where: { userId, topic: { not: null } },
      distinct: ["topic"],
      select: { topic: true },
      orderBy: { topic: "asc" },
    }),
    prisma.problem.count({ where }),
  ]);

  return {
    items: problems.map((problem) => toProblemListItem(problem, today)),
    topics: topics
      .map((t) => t.topic)
      .filter((t): t is string => t !== null),
    totalCount,
  };
}

/** Full detail view for one problem, including the permanent revision history. */
export async function getProblemDetail(
  userId: string,
  problemId: string,
  timezone: string
): Promise<ProblemDetail | null> {
  const problem = await prisma.problem.findFirst({
    where: { id: problemId, userId },
    include: {
      revisions: { orderBy: [{ cycle: "asc" }, { stage: "asc" }] },
    },
  });
  if (!problem) return null;

  const today = todayInTimezone(timezone);
  const item = toProblemListItem(problem, today);

  const history: RevisionHistoryItem[] = problem.revisions.map((revision) => {
    const completedDate = todayInTimezone(timezone, revision.completedAt);
    const lateBy = Math.max(
      0,
      daysBetween(revision.scheduledDate, completedDate)
    );
    return {
      id: revision.id,
      stage: revision.stage,
      stageName: stageName(revision.stage),
      scheduledDate: toPlainDateString(revision.scheduledDate),
      completedAt: formatInstant(revision.completedAt, timezone),
      wasLate: lateBy > 0,
      lateBy,
    };
  });

  return {
    ...item,
    description: problem.description,
    cycleStartedOn: toPlainDateString(problem.solvedAt),
    history,
  };
}
