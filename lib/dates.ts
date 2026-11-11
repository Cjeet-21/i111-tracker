/**
 * Calendar-date helpers.
 *
 * Revision scheduling is day-based, not instant-based. To avoid every
 * time-zone/DST pitfall, plain calendar dates are represented as JS Date
 * objects anchored at UTC midnight (e.g. 2026-09-21T00:00:00.000Z).
 *
 * - Arithmetic (addDays, compare, ranges) is pure and DST-free.
 * - The user's IANA time zone is only used to answer two questions:
 *   1. "What is today for this user?"        -> todayInTimezone()
 *   2. "Which UTC instant starts this day?"  -> startOfPlainDateInTimezone()
 */

const DAY_MS = 86_400_000;

export class InvalidTimezoneError extends Error {
  constructor(timezone: string) {
    super(`Invalid time zone: ${timezone}`);
    this.name = "InvalidTimezoneError";
  }
}

/** Build a plain calendar date (UTC midnight) from parts. */
export function plainDate(year: number, month: number, day: number): Date {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid calendar date: ${year}-${month}-${day}`);
  }
  return d;
}

/** Parse an `YYYY-MM-DD` string (HTML date input) into a plain date. */
export function parsePlainDateInput(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new RangeError(`Invalid date input: ${value}`);
  }
  const [, y, m, d] = match;
  return plainDate(Number(y), Number(m), Number(d));
}

/** Format a plain date as `YYYY-MM-DD`. */
export function toPlainDateString(date: Date): string {
  const y = String(date.getUTCFullYear()).padStart(4, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Add (or subtract) whole days from a plain date. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Difference in whole days: b - a. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Negative if a < b, 0 if equal, positive if a > b. */
export function comparePlainDates(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

export function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

export function isAfter(a: Date, b: Date): boolean {
  return a.getTime() > b.getTime();
}

/** First day of the month containing `date` (plain). */
export function startOfMonth(date: Date): Date {
  return plainDate(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}

/** Last day of the month containing `date` (plain). */
export function endOfMonth(date: Date): Date {
  const first = startOfMonth(date);
  const nextMonth = plainDate(
    first.getUTCFullYear(),
    first.getUTCMonth() + 2,
    1
  );
  return addDays(nextMonth, -1);
}

/** Add months, clamping the day (e.g. Jan 31 + 1 month -> Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const totalMonths =
    date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(totalMonths / 12);
  const month = totalMonths % 12; // 0-based
  const lastDayOfTarget = new Date(
    Date.UTC(year, month + 1, 0)
  ).getUTCDate();
  const day = Math.min(date.getUTCDate(), lastDayOfTarget);
  return plainDate(year, month + 1, day);
}

/** `YYYY-MM` key for a plain date. */
export function monthKey(date: Date): string {
  const y = String(date.getUTCFullYear()).padStart(4, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function assertValidTimezone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    throw new InvalidTimezoneError(timeZone);
  }
}

export function isValidTimezone(timeZone: string): boolean {
  try {
    assertValidTimezone(timeZone);
    return true;
  } catch {
    return false;
  }
}

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = partsFormatterCache.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsFormatterCache.set(timeZone, fmt);
  }
  return fmt;
}

/** Wall-clock calendar date for an instant in a given IANA time zone. */
export function todayInTimezone(
  timeZone: string,
  now: Date = new Date()
): Date {
  assertValidTimezone(timeZone);
  const parts = getPartsFormatter(timeZone).formatToParts(now);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") lookup[part.type] = part.value;
  }
  return plainDate(
    Number(lookup.year),
    Number(lookup.month),
    Number(lookup.day)
  );
}

/** UTC offset (ms) of a time zone at a given instant (local - UTC). */
export function timezoneOffsetMs(timeZone: string, instant: Date): number {
  assertValidTimezone(timeZone);
  const parts = getPartsFormatter(timeZone).formatToParts(instant);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") lookup[part.type] = part.value;
  }
  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second)
  );
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * The UTC instant at which a calendar day starts in a given time zone.
 * Used to turn "revisions completed today" into a UTC query range.
 */
export function startOfPlainDateInTimezone(
  timeZone: string,
  date: Date
): Date {
  assertValidTimezone(timeZone);
  const naive = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  let guess = naive;
  // Two iterations converge even across DST transitions.
  for (let i = 0; i < 2; i += 1) {
    guess = naive - timezoneOffsetMs(timeZone, new Date(guess));
  }
  return new Date(guess);
}

/** Exclusive end instant of a calendar day in a time zone (= next day's start). */
export function endOfPlainDateInTimezone(
  timeZone: string,
  date: Date
): Date {
  return startOfPlainDateInTimezone(timeZone, addDays(date, 1));
}

/** Human-friendly date, e.g. "21 Sep 2026". */
export function formatPlainDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  }
): string {
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: "UTC",
  }).format(date);
}

/** e.g. "Monday, 21 September 2026" */
export function formatLongDate(date: Date): string {
  return formatPlainDate(date, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** e.g. "Sep 21, 2026, 10:31 AM" — instant rendered in the user's zone. */
export function formatInstant(
  instant: Date,
  timeZone: string
): string {
  assertValidTimezone(timeZone);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(instant);
}
