import "server-only";

import { prisma } from "@/lib/db";
import {
  addDays,
  addMonths,
  endOfMonth,
  formatPlainDate,
  monthKey,
  parsePlainDateInput,
  startOfMonth,
  toPlainDateString,
  todayInTimezone,
} from "@/lib/dates";
import type { CalendarDayCell, CalendarMonthView } from "@/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface CalendarView {
  view: CalendarMonthView;
  /** Selected day (`YYYY-MM-DD`) when the user clicked a date. */
  selectedDate: string | null;
}

/**
 * Month grid (Mon-first) with the number of scheduled revisions per day.
 * Only ACTIVE cycles are counted — completed problems have no schedule.
 */
export async function getCalendarView(
  userId: string,
  timezone: string,
  monthParam?: string,
  dateParam?: string
): Promise<CalendarView> {
  const today = todayInTimezone(timezone);
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam
    : monthKey(today);

  const [year, monthNumber] = month.split("-").map(Number);
  const firstOfMonth = startOfMonth(parsePlainDateInput(`${month}-01`));
  const lastOfMonth = endOfMonth(firstOfMonth);
  const previousMonth = addMonths(firstOfMonth, -1);
  const nextMonth = addMonths(firstOfMonth, 1);

  const scheduled = await prisma.problem.findMany({
    where: {
      userId,
      status: "ACTIVE",
      nextRevisionDate: { gte: firstOfMonth, lte: lastOfMonth },
    },
    select: { nextRevisionDate: true },
  });

  const counts = new Map<string, number>();
  for (const problem of scheduled) {
    const key = toPlainDateString(problem.nextRevisionDate);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const todayStr = toPlainDateString(today);
  const monthStartWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // Mon = 0
  const gridStart = addDays(firstOfMonth, -monthStartWeekday);
  const gridEndWeekday = (lastOfMonth.getUTCDay() + 6) % 7;
  const gridEnd = addDays(lastOfMonth, 6 - gridEndWeekday);

  const weeks: CalendarDayCell[][] = [];
  let cursor = gridStart;
  let week: CalendarDayCell[] = [];
  while (cursor.getTime() <= gridEnd.getTime()) {
    const dateStr = toPlainDateString(cursor);
    week.push({
      date: dateStr,
      dayOfMonth: cursor.getUTCDate(),
      isToday: dateStr === todayStr,
      isCurrentMonth:
        cursor.getUTCFullYear() === year &&
        cursor.getUTCMonth() + 1 === monthNumber,
      count: counts.get(dateStr) ?? 0,
    });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    cursor = addDays(cursor, 1);
  }
  if (week.length > 0) weeks.push(week);

  const selectedDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null;

  return {
    selectedDate,
    view: {
      monthKey: month,
      label: formatPlainDate(firstOfMonth, {
        month: "long",
        year: "numeric",
      }),
      previousMonthKey: monthKey(previousMonth),
      nextMonthKey: monthKey(nextMonth),
      weeks,
    },
  };
}

export { WEEKDAYS };
