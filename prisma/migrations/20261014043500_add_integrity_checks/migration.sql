-- Data-integrity constraints that cannot be expressed in the Prisma schema.
ALTER TABLE "problems"
  ADD CONSTRAINT "problems_current_stage_check" CHECK ("currentStage" BETWEEN 0 AND 4),
  ADD CONSTRAINT "problems_cycle_check" CHECK ("cycle" >= 1);

ALTER TABLE "revision_history"
  ADD CONSTRAINT "revision_history_stage_check" CHECK ("stage" BETWEEN 0 AND 4),
  ADD CONSTRAINT "revision_history_cycle_check" CHECK ("cycle" >= 1);
