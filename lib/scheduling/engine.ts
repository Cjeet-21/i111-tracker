/**
 * Pure i111 scheduling engine.
 *
 * Stages:  0 = Immediate, 1 = 1 Day, 2 = 1 Week, 3 = 1 Month, 4 = Completed
 *
 * Rules:
 *  - A new problem's Immediate revision is due on the day it was solved.
 *  - Completing a stage schedules the NEXT stage from the ACTUAL completion
 *    date (never from the originally scheduled date), so a late revision never
 *    produces an impossible/backdated schedule.
 *  - Completing the final stage closes the cycle.
 *
 * All dates are plain calendar dates (UTC-midnight) from `lib/dates`.
 */

import { addDays, comparePlainDates, daysBetween } from "@/lib/dates";
import {
  I111_INTERVALS,
  type RevisionInterval,
  STAGE_SHORT_NAMES,
} from "@/lib/scheduling/intervals";

export type CycleStatus = "ACTIVE" | "COMPLETED";

export interface ScheduleState {
  stage: number;
  nextRevisionDate: Date | null;
  status: CycleStatus;
}

export interface AdvanceResult extends ScheduleState {
  /** The stage that was just completed. */
  completedStage: number;
  /** Stage scheduled next, or null when the cycle closed. */
  nextStage: number | null;
}

export class InvalidStageError extends Error {
  constructor(stage: number) {
    super(`Invalid revision stage: ${stage}`);
    this.name = "InvalidStageError";
  }
}

function assertValidConfig(intervals: readonly RevisionInterval[]): void {
  if (intervals.length === 0) {
    throw new Error("Schedule config must contain at least one interval");
  }
  intervals.forEach((interval, index) => {
    if (interval.stage !== index) {
      throw new Error(
        `Schedule config stages must be contiguous starting at 0 (got ${interval.stage} at index ${index})`
      );
    }
    if (!Number.isInteger(interval.days) || interval.days < 0) {
      throw new Error(
        `Interval days must be a non-negative integer (stage ${interval.stage}: ${interval.days})`
      );
    }
  });
  // "Immediate" (stage 0) is due on the solve date itself.
  if (intervals[0].days !== 0) {
    throw new Error("Stage 0 (Immediate) must have 0 days");
  }
}

function assertValidStage(
  stage: number,
  intervals: readonly RevisionInterval[]
): void {
  // Valid stages are exactly the configured intervals (0..length-1).
  // The completed marker (intervals.length) is not a stage that can advance.
  if (
    !Number.isInteger(stage) ||
    stage < 0 ||
    stage >= intervals.length
  ) {
    throw new InvalidStageError(stage);
  }
}

/**
 * Initial schedule for a newly added problem.
 * Immediate revision is due on the solve date.
 */
export function initialSchedule(
  solvedOn: Date,
  intervals: readonly RevisionInterval[] = I111_INTERVALS
): ScheduleState {
  assertValidConfig(intervals);
  return {
    stage: 0,
    nextRevisionDate: solvedOn,
    status: "ACTIVE",
  };
}

/**
 * Advance after the user marks the current stage as revised.
 * `completedOn` is the ACTUAL calendar date the revision happened.
 */
export function advanceStage(
  currentStage: number,
  completedOn: Date,
  intervals: readonly RevisionInterval[] = I111_INTERVALS
): AdvanceResult {
  assertValidConfig(intervals);
  assertValidStage(currentStage, intervals);

  if (currentStage >= intervals.length - 1) {
    // Final revision done — the cycle is complete.
    return {
      completedStage: currentStage,
      nextStage: null,
      stage: intervals.length,
      nextRevisionDate: null,
      status: "COMPLETED",
    };
  }

  const nextStage = currentStage + 1;
  const { days } = intervals[nextStage];
  return {
    completedStage: currentStage,
    nextStage,
    stage: nextStage,
    nextRevisionDate: addDays(completedOn, days),
    status: "ACTIVE",
  };
}

/** A revision is overdue when its date is strictly before today. */
export function isOverdue(nextRevisionDate: Date, today: Date): boolean {
  return comparePlainDates(nextRevisionDate, today) < 0;
}

/** Due today or earlier (overdue included). */
export function isDueOnOrBefore(nextRevisionDate: Date, today: Date): boolean {
  return comparePlainDates(nextRevisionDate, today) <= 0;
}

/** Whole days past due (0 when not overdue). */
export function daysOverdue(nextRevisionDate: Date, today: Date): number {
  if (!isOverdue(nextRevisionDate, today)) return 0;
  return daysBetween(nextRevisionDate, today);
}

/** Display name for a stage ("Immediate", "1 Day", ... "Completed"). */
export function stageName(
  stage: number,
  intervals: readonly RevisionInterval[] = I111_INTERVALS
): string {
  if (stage >= intervals.length) return "Completed";
  const interval = intervals.find((i) => i.stage === stage);
  return interval?.name ?? `Stage ${stage}`;
}

/** Short display name for a stage. */
export function stageShortName(stage: number): string {
  return STAGE_SHORT_NAMES[stage] ?? `Stage ${stage}`;
}

/** How many days after the previous revision the given stage is scheduled. */
export function stageIntervalDays(
  stage: number,
  intervals: readonly RevisionInterval[] = I111_INTERVALS
): number | null {
  const interval = intervals.find((i) => i.stage === stage);
  return interval ? interval.days : null;
}
