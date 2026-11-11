"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { toPlainDateString, todayInTimezone } from "@/lib/dates";
import {
  advanceStage,
  stageName,
} from "@/lib/scheduling/engine";
import type { ActionResult } from "@/types";

export interface MarkRevisedResult {
  completedStageName: string;
  cycleCompleted: boolean;
  nextStageName?: string;
  nextDate?: string;
}

export type MarkRevisedState = ActionResult<MarkRevisedResult> | null;

/**
 * Record a revision:
 *  1. append an immutable row to revision_history (scheduled + actual time),
 *  2. advance the stage,
 *  3. schedule the next revision from the ACTUAL completion date,
 *  4. close the i111 cycle after the final (1 Month) revision.
 *
 * Runs in a transaction; the (problemId, cycle, stage) unique constraint
 * makes double submissions impossible.
 */
export async function markRevisedAction(
  _prev: MarkRevisedState,
  formData: FormData
): Promise<ActionResult<MarkRevisedResult>> {
  const user = await requireUser();
  const problemId = String(formData.get("problemId") ?? "");
  if (!problemId) {
    return { success: false, error: "Missing problem id." };
  }
  const completedDate = todayInTimezone(user.timezone);
  const completedAt = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const problem = await tx.problem.findFirst({
        where: { id: problemId, userId: user.id },
      });
      if (!problem) {
        return { ok: false as const, error: "Problem not found." };
      }
      if (problem.status === "COMPLETED") {
        return {
          ok: false as const,
          error: "This problem has already completed its i111 cycle.",
        };
      }

      const advanced = advanceStage(problem.currentStage, completedDate);

      await tx.revisionHistory.create({
        data: {
          problemId: problem.id,
          userId: user.id,
          cycle: problem.cycle,
          stage: problem.currentStage,
          scheduledDate: problem.nextRevisionDate,
          completedAt,
        },
      });

      const updated = await tx.problem.update({
        where: { id: problem.id },
        data: {
          currentStage: advanced.stage,
          // Completed cycles keep their final due date; the UI shows "—".
          nextRevisionDate: advanced.nextRevisionDate ?? completedDate,
          status: advanced.status,
        },
      });

      return {
        ok: true as const,
        completedStageName: stageName(problem.currentStage),
        cycleCompleted: advanced.status === "COMPLETED",
        nextStageName:
          advanced.nextStage === null
            ? undefined
            : stageName(advanced.nextStage),
        nextDate:
          advanced.nextRevisionDate === null
            ? undefined
            : toPlainDateString(advanced.nextRevisionDate),
        updatedStage: updated.currentStage,
      };
    });

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    revalidatePath("/revisions");
    revalidatePath("/dashboard");
    revalidatePath("/problems");
    revalidatePath("/statistics");
    revalidatePath("/calendar");
    revalidatePath(`/problems/${problemId}`);

    return {
      success: true,
      completedStageName: result.completedStageName,
      cycleCompleted: result.cycleCompleted,
      nextStageName: result.nextStageName,
      nextDate: result.nextDate,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "This revision was already recorded.",
      };
    }
    throw error;
  }
}
