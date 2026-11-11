/**
 * Revision schedule configuration.
 *
 * The i111 schedule is the default, but it is just data — supporting a custom
 * schedule (e.g. Immediate / 1 Day / 3 Days / 1 Week / 1 Month / 3 Months)
 * means passing a different `RevisionInterval[]` to the engine, not rewriting
 * it.
 */

export interface RevisionInterval {
  /** Stage number. Must be contiguous starting at 0. */
  stage: number;
  /** Display name shown in the UI. */
  name: string;
  /** Days after the previous (actual) completion date when this stage is due. */
  days: number;
}

/** Stage index meaning "the whole i111 cycle has finished". */
export const COMPLETED_STAGE = 4;

/** Default i111 schedule. */
export const I111_INTERVALS: readonly RevisionInterval[] = Object.freeze([
  Object.freeze({ stage: 0, name: "Immediate", days: 0 }),
  Object.freeze({ stage: 1, name: "1 Day", days: 1 }),
  Object.freeze({ stage: 2, name: "1 Week", days: 7 }),
  Object.freeze({ stage: 3, name: "1 Month", days: 30 }),
]);

/** Short labels used in tight UI spaces (badges, table cells). */
export const STAGE_SHORT_NAMES: readonly string[] = Object.freeze([
  "Immediate",
  "1 Day",
  "1 Week",
  "1 Month",
  "Completed",
]);
