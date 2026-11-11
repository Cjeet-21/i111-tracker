import { describe, expect, test } from "vitest";
import {
  advanceStage,
  daysOverdue,
  initialSchedule,
  InvalidStageError,
  isDueOnOrBefore,
  isOverdue,
  stageName,
} from "@/lib/scheduling/engine";
import { I111_INTERVALS, type RevisionInterval } from "@/lib/scheduling/intervals";
import { plainDate } from "@/lib/dates";

const SEP_21 = plainDate(2026, 9, 21);

describe("i111 — new problem", () => {
  test("problem created Sep 21 → Immediate revision due Sep 21", () => {
    const schedule = initialSchedule(SEP_21);
    expect(schedule.stage).toBe(0);
    expect(schedule.status).toBe("ACTIVE");
    expect(schedule.nextRevisionDate?.toISOString()).toBe(
      SEP_21.toISOString()
    );
    expect(stageName(schedule.stage)).toBe("Immediate");
  });
});

describe("i111 — stage progression (happy path)", () => {
  test("Immediate completed Sep 21 → 1 Day due Sep 22", () => {
    const result = advanceStage(0, SEP_21);
    expect(result.completedStage).toBe(0);
    expect(result.stage).toBe(1);
    expect(result.status).toBe("ACTIVE");
    expect(result.nextRevisionDate?.toISOString()).toBe(
      plainDate(2026, 9, 22).toISOString()
    );
    expect(stageName(result.stage)).toBe("1 Day");
  });

  test("1 Day completed Sep 22 → 1 Week due Sep 29", () => {
    const result = advanceStage(1, plainDate(2026, 9, 22));
    expect(result.stage).toBe(2);
    expect(result.nextRevisionDate?.toISOString()).toBe(
      plainDate(2026, 9, 29).toISOString()
    );
    expect(stageName(result.stage)).toBe("1 Week");
  });

  test("1 Week completed Sep 29 → 1 Month due Oct 29", () => {
    const result = advanceStage(2, plainDate(2026, 9, 29));
    expect(result.stage).toBe(3);
    expect(result.nextRevisionDate?.toISOString()).toBe(
      plainDate(2026, 10, 29).toISOString()
    );
    expect(stageName(result.stage)).toBe("1 Month");
  });

  test("1 Month completed Oct 29 → cycle completed", () => {
    const result = advanceStage(3, plainDate(2026, 10, 29));
    expect(result.stage).toBe(4);
    expect(result.status).toBe("COMPLETED");
    expect(result.nextRevisionDate).toBeNull();
    expect(result.nextStage).toBeNull();
    expect(stageName(result.stage)).toBe("Completed");
  });

  test("full cycle from solve date produces exactly 4 revisions", () => {
    let schedule = initialSchedule(SEP_21);
    const dueDates: (Date | null)[] = [schedule.nextRevisionDate];

    // User revises every day the revision becomes available.
    let completedOn = schedule.nextRevisionDate!;
    while (schedule.status === "ACTIVE") {
      const advanced = advanceStage(schedule.stage, completedOn);
      schedule = {
        stage: advanced.stage,
        nextRevisionDate: advanced.nextRevisionDate,
        status: advanced.status,
      };
      dueDates.push(schedule.nextRevisionDate);
      if (schedule.nextRevisionDate) completedOn = schedule.nextRevisionDate;
    }

    expect(dueDates).toEqual([
      plainDate(2026, 9, 21), // Immediate
      plainDate(2026, 9, 22), // 1 Day
      plainDate(2026, 9, 29), // 1 Week
      plainDate(2026, 10, 29), // 1 Month
      null, // completed
    ]);
  });
});

describe("i111 — late revisions calculate from the ACTUAL completion date", () => {
  test("Immediate scheduled Sep 21, done Sep 24 → 1 Day due Sep 25 (not Sep 22)", () => {
    const result = advanceStage(0, plainDate(2026, 9, 24));
    expect(result.stage).toBe(1);
    expect(result.nextRevisionDate?.toISOString()).toBe(
      plainDate(2026, 9, 25).toISOString()
    );
  });

  test("1 Day scheduled Sep 22, done Sep 25 → 1 Week due Oct 2 (not Sep 29)", () => {
    const result = advanceStage(1, plainDate(2026, 9, 25));
    expect(result.stage).toBe(2);
    expect(result.nextRevisionDate?.toISOString()).toBe(
      plainDate(2026, 10, 2).toISOString()
    );
  });

  test("1 Week scheduled Sep 11, done Sep 14 → 1 Month due Oct 14 (spec example)", () => {
    const result = advanceStage(2, plainDate(2026, 9, 14));
    expect(result.stage).toBe(3);
    expect(result.nextRevisionDate?.toISOString()).toBe(
      plainDate(2026, 10, 14).toISOString()
    );
  });

  test("very late final revision still closes the cycle", () => {
    const result = advanceStage(3, plainDate(2027, 1, 15));
    expect(result.status).toBe("COMPLETED");
    expect(result.stage).toBe(4);
  });
});

describe("overdue revisions", () => {
  const scheduled = plainDate(2026, 9, 22);
  const today = plainDate(2026, 9, 25);

  test("scheduled Sep 22, today Sep 25 → 3 days overdue and still due", () => {
    expect(isOverdue(scheduled, today)).toBe(true);
    expect(daysOverdue(scheduled, today)).toBe(3);
    expect(isDueOnOrBefore(scheduled, today)).toBe(true);
  });

  test("due today is not overdue but is due", () => {
    expect(isOverdue(scheduled, scheduled)).toBe(false);
    expect(daysOverdue(scheduled, scheduled)).toBe(0);
    expect(isDueOnOrBefore(scheduled, scheduled)).toBe(true);
  });

  test("future revision is neither overdue nor due", () => {
    const future = plainDate(2026, 9, 30);
    expect(isOverdue(future, today)).toBe(false);
    expect(daysOverdue(future, today)).toBe(0);
    expect(isDueOnOrBefore(future, today)).toBe(false);
  });
});

describe("engine validation", () => {
  test("rejects invalid stages", () => {
    expect(() => advanceStage(-1, SEP_21)).toThrow(InvalidStageError);
    expect(() => advanceStage(4, SEP_21)).toThrow(InvalidStageError);
    expect(() => advanceStage(99, SEP_21)).toThrow(InvalidStageError);
    expect(() => advanceStage(1.5, SEP_21)).toThrow(InvalidStageError);
  });

  test("rejects invalid schedule configs", () => {
    const bad: RevisionInterval[] = [
      { stage: 0, name: "Immediate", days: 1 },
    ];
    expect(() => initialSchedule(SEP_21, bad)).toThrow(/Immediate/);

    const gapped: RevisionInterval[] = [
      { stage: 0, name: "Immediate", days: 0 },
      { stage: 2, name: "Weird", days: 3 },
    ];
    expect(() => initialSchedule(SEP_21, gapped)).toThrow(/contiguous/);
  });
});

describe("extensibility — custom schedules", () => {
  const CUSTOM: RevisionInterval[] = [
    { stage: 0, name: "Immediate", days: 0 },
    { stage: 1, name: "1 Day", days: 1 },
    { stage: 2, name: "3 Days", days: 3 },
    { stage: 3, name: "1 Week", days: 7 },
    { stage: 4, name: "1 Month", days: 30 },
    { stage: 5, name: "3 Months", days: 90 },
  ];

  test("a custom 6-stage schedule works with the same engine", () => {
    expect(initialSchedule(SEP_21, CUSTOM).nextRevisionDate).toEqual(SEP_21);

    let stage = 0;
    let completedOn = SEP_21;
    const dates: string[] = [];
    while (true) {
      const advanced = advanceStage(stage, completedOn, CUSTOM);
      if (advanced.status === "COMPLETED") break;
      stage = advanced.stage;
      completedOn = advanced.nextRevisionDate!;
      dates.push(completedOn.toISOString().slice(0, 10));
    }

    expect(dates).toEqual([
      "2026-09-22", // +1
      "2026-09-25", // +3
      "2026-10-02", // +7
      "2026-11-01", // +30
      "2027-01-30", // +90
    ]);
    expect(stage).toBe(5);
  });

  test("default i111 config is the documented schedule", () => {
    expect(I111_INTERVALS.map((i) => i.days)).toEqual([0, 1, 7, 30]);
    expect(I111_INTERVALS.map((i) => i.name)).toEqual([
      "Immediate",
      "1 Day",
      "1 Week",
      "1 Month",
    ]);
  });
});
