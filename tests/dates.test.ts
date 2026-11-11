import { describe, expect, test } from "vitest";
import {
  addDays,
  addMonths,
  daysBetween,
  endOfMonth,
  endOfPlainDateInTimezone,
  InvalidTimezoneError,
  isValidTimezone,
  monthKey,
  parsePlainDateInput,
  plainDate,
  startOfMonth,
  startOfPlainDateInTimezone,
  timezoneOffsetMs,
  toPlainDateString,
  todayInTimezone,
} from "@/lib/dates";

describe("plain date helpers", () => {
  test("round-trips YYYY-MM-DD strings", () => {
    const date = plainDate(2026, 9, 21);
    expect(toPlainDateString(date)).toBe("2026-09-21");
    expect(parsePlainDateInput("2026-09-21")).toEqual(date);
  });

  test("rejects malformed or impossible dates", () => {
    expect(() => parsePlainDateInput("21-09-2026")).toThrow(RangeError);
    expect(() => parsePlainDateInput("2026-9-21")).toThrow(RangeError);
    expect(() => plainDate(2026, 2, 30)).toThrow(RangeError);
  });

  test("addDays / daysBetween", () => {
    expect(addDays(plainDate(2026, 9, 21), 7)).toEqual(plainDate(2026, 9, 28));
    expect(addDays(plainDate(2026, 9, 21), -3)).toEqual(plainDate(2026, 9, 18));
    expect(daysBetween(plainDate(2026, 9, 21), plainDate(2026, 10, 1))).toBe(
      10
    );
  });

  test("month arithmetic", () => {
    expect(startOfMonth(plainDate(2026, 9, 21))).toEqual(plainDate(2026, 9, 1));
    expect(endOfMonth(plainDate(2026, 9, 21))).toEqual(plainDate(2026, 9, 30));
    expect(endOfMonth(plainDate(2024, 2, 10))).toEqual(plainDate(2024, 2, 29));
    expect(addMonths(plainDate(2026, 1, 31), 1)).toEqual(plainDate(2026, 2, 28));
    expect(monthKey(plainDate(2026, 9, 21))).toBe("2026-09");
  });
});

describe("today in the user's time zone", () => {
  test("same instant is different calendar days in different zones", () => {
    // 02:00 UTC on Sep 21 → already Sep 21 in Kolkata (UTC+5:30),
    // but still Sep 20 in Los Angeles (UTC-7 during DST).
    const instant = new Date("2026-09-21T02:00:00.000Z");
    expect(toPlainDateString(todayInTimezone("UTC", instant))).toBe(
      "2026-09-21"
    );
    expect(
      toPlainDateString(todayInTimezone("Asia/Kolkata", instant))
    ).toBe("2026-09-21");
    expect(
      toPlainDateString(todayInTimezone("America/Los_Angeles", instant))
    ).toBe("2026-09-20");
    expect(
      toPlainDateString(todayInTimezone("Pacific/Auckland", instant))
    ).toBe("2026-09-21");
  });

  test("day boundary exactly at local midnight", () => {
    // 18:30 UTC Sep 20 = 00:00 Sep 21 in Kolkata.
    const instant = new Date("2026-09-20T18:30:00.000Z");
    expect(
      toPlainDateString(todayInTimezone("Asia/Kolkata", instant))
    ).toBe("2026-09-21");
    const oneMinuteEarlier = new Date("2026-09-20T18:29:00.000Z");
    expect(
      toPlainDateString(todayInTimezone("Asia/Kolkata", oneMinuteEarlier))
    ).toBe("2026-09-20");
  });

  test("rejects invalid time zones", () => {
    expect(isValidTimezone("Mars/Olympus_Mons")).toBe(false);
    expect(() => todayInTimezone("Mars/Olympus_Mons")).toThrow(
      InvalidTimezoneError
    );
  });
});

describe("day-start instants (UTC query ranges)", () => {
  test("UTC day starts at 00:00Z", () => {
    expect(
      startOfPlainDateInTimezone("UTC", plainDate(2026, 9, 21)).toISOString()
    ).toBe("2026-09-21T00:00:00.000Z");
  });

  test("half-hour offset zone (Asia/Kolkata)", () => {
    expect(
      startOfPlainDateInTimezone(
        "Asia/Kolkata",
        plainDate(2026, 9, 21)
      ).toISOString()
    ).toBe("2026-09-20T18:30:00.000Z");
    expect(
      endOfPlainDateInTimezone("Asia/Kolkata", plainDate(2026, 9, 21)).toISOString()
    ).toBe("2026-09-21T18:30:00.000Z");
  });

  test("DST transition day keeps the correct local midnight (US spring forward 2026-03-08)", () => {
    // In New York, DST starts 2026-03-08 (02:00 → 03:00 local).
    const dayStart = startOfPlainDateInTimezone(
      "America/New_York",
      plainDate(2026, 3, 8)
    );
    // Local midnight on Mar 8 is EST (UTC-5) — before the 2am jump.
    expect(dayStart.toISOString()).toBe("2026-03-08T05:00:00.000Z");

    const nextDayStart = startOfPlainDateInTimezone(
      "America/New_York",
      plainDate(2026, 3, 9)
    );
    // Mar 9 midnight is EDT (UTC-4).
    expect(nextDayStart.toISOString()).toBe("2026-03-09T04:00:00.000Z");

    // The day is only 23 hours long.
    expect((nextDayStart.getTime() - dayStart.getTime()) / 3_600_000).toBe(23);
  });

  test("timezone offsets", () => {
    const instant = new Date("2026-09-21T12:00:00.000Z");
    expect(timezoneOffsetMs("UTC", instant)).toBe(0);
    expect(timezoneOffsetMs("Asia/Kolkata", instant)).toBe(5.5 * 3_600_000);
  });
});

describe("scheduling arithmetic is DST-free", () => {
  test("adding days across a DST boundary never drifts", () => {
    // Mar 6 + 3 days spans the 2026 US spring-forward (Mar 8).
    expect(addDays(plainDate(2026, 3, 6), 3)).toEqual(plainDate(2026, 3, 9));
    // And the autumn fall-back (Nov 1 2026).
    expect(addDays(plainDate(2026, 10, 30), 3)).toEqual(plainDate(2026, 11, 2));
  });
});
