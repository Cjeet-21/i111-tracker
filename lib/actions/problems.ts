"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { parsePlainDateInput, toPlainDateString, todayInTimezone } from "@/lib/dates";
import { initialSchedule, stageName } from "@/lib/scheduling/engine";
import {
  formatZodError,
  problemSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/types";

export interface ProblemFormState {
  error?: string;
  success?: boolean;
  problemId?: string;
  message?: string;
}

function readProblemForm(formData: FormData) {
  return problemSchema.safeParse({
    title: formData.get("title") ?? "",
    url: formData.get("url") ?? "",
    description: formData.get("description") ?? "",
    topic: formData.get("topic") ?? "",
    difficulty: formData.get("difficulty") ?? "",
    solvedAt: formData.get("solvedAt") ?? "",
  });
}

function revalidateProblemPages(problemId?: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/revisions");
  revalidatePath("/problems");
  revalidatePath("/statistics");
  revalidatePath("/calendar");
  if (problemId) revalidatePath(`/problems/${problemId}`);
}

export async function createProblemAction(
  _prev: ProblemFormState,
  formData: FormData
): Promise<ProblemFormState> {
  const user = await requireUser();

  const parsed = readProblemForm(formData);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const today = todayInTimezone(user.timezone);
  const solvedAt = parsePlainDateInput(parsed.data.solvedAt);
  if (solvedAt.getTime() > today.getTime()) {
    return { error: "The solve date cannot be in the future." };
  }

  const schedule = initialSchedule(solvedAt);
  const problem = await prisma.problem.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description,
      topic: parsed.data.topic,
      difficulty: parsed.data.difficulty ?? null,
      solvedAt,
      currentStage: schedule.stage,
      nextRevisionDate: schedule.nextRevisionDate ?? solvedAt,
      status: schedule.status,
    },
  });

  revalidateProblemPages(problem.id);
  return {
    success: true,
    problemId: problem.id,
    message: `Added — ${stageName(0)} revision due ${toPlainDateString(solvedAt) === toPlainDateString(today) ? "today" : toPlainDateString(schedule.nextRevisionDate ?? solvedAt)}.`,
  };
}

export async function updateProblemAction(
  _prev: ProblemFormState,
  formData: FormData
): Promise<ProblemFormState> {
  const user = await requireUser();
  const problemId = String(formData.get("problemId") ?? "");
  if (!problemId) {
    return { error: "Missing problem id." };
  }

  const parsed = readProblemForm(formData);
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const existing = await prisma.problem.findFirst({
    where: { id: problemId, userId: user.id },
    include: { _count: { select: { revisions: true } } },
  });
  if (!existing) {
    return { error: "Problem not found." };
  }

  const today = todayInTimezone(user.timezone);
  const solvedAt = parsePlainDateInput(parsed.data.solvedAt);
  if (solvedAt.getTime() > today.getTime()) {
    return { error: "The solve date cannot be in the future." };
  }

  const solvedAtChanged =
    solvedAt.getTime() !== existing.solvedAt.getTime();
  if (solvedAtChanged && existing._count.revisions > 0) {
    return {
      error:
        "The solve date can only be changed before the first revision is completed.",
    };
  }

  const schedule =
    solvedAtChanged && existing._count.revisions === 0
      ? initialSchedule(solvedAt)
      : null;

  await prisma.problem.update({
    where: { id: problemId },
    data: {
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description,
      topic: parsed.data.topic,
      difficulty: parsed.data.difficulty ?? null,
      solvedAt,
      ...(schedule
        ? {
            currentStage: schedule.stage,
            nextRevisionDate: schedule.nextRevisionDate ?? solvedAt,
            status: schedule.status,
          }
        : {}),
    },
  });

  revalidateProblemPages(problemId);
  return { success: true, message: "Problem updated." };
}

export async function deleteProblemAction(problemId: string): Promise<
  ActionResult<{ problemId: string }>
> {
  const user = await requireUser();

  const result = await prisma.problem.deleteMany({
    where: { id: problemId, userId: user.id },
  });
  if (result.count === 0) {
    return { success: false, error: "Problem not found." };
  }

  revalidateProblemPages(problemId);
  return { success: true, problemId };
}
