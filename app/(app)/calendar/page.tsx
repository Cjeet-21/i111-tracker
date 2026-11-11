import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getCalendarView, WEEKDAYS } from "@/lib/queries/calendar";
import { getProblemsScheduledOn } from "@/lib/queries/revisions";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons";
import { Badge, EmptyState, PageHeader, cardClass } from "@/components/ui";

export const metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

function monthHref(month: string): string {
  return `/calendar?month=${month}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const { view, selectedDate } = await getCalendarView(
    user.id,
    user.timezone,
    typeof params.month === "string" ? params.month : undefined,
    typeof params.date === "string" ? params.date : undefined
  );

  const selectedProblems = selectedDate
    ? await getProblemsScheduledOn(user.id, selectedDate)
    : [];

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Number of scheduled revisions per day"
      />

      <div className={`${cardClass} p-4 md:p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={monthHref(view.previousMonthKey)}
            aria-label="Previous month"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Link>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <CalendarIcon className="h-5 w-5 text-indigo-500" />
            {view.label}
          </h2>
          <Link
            href={monthHref(view.nextMonthKey)}
            aria-label="Next month"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day[0]}</span>
            </div>
          ))}

          {view.weeks.flat().map((cell) => {
            const selected = selectedDate === cell.date;
            return (
              <Link
                key={cell.date}
                href={`/calendar?month=${view.monthKey}&date=${cell.date}`}
                aria-label={`${cell.date}, ${cell.count} scheduled`}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition sm:aspect-auto sm:min-h-14 ${
                  selected
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                } ${cell.isToday ? "ring-2 ring-indigo-400" : ""} ${
                  cell.isCurrentMonth
                    ? "text-slate-800"
                    : "text-slate-300"
                }`}
              >
                <span className="font-medium">{cell.dayOfMonth}</span>
                {cell.count > 0 ? (
                  <span
                    className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      cell.isCurrentMonth
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {cell.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      {selectedDate ? (
        <div className="mt-5">
          <h3 className="mb-3 text-base font-semibold text-slate-900">
            Scheduled for {selectedDate}
          </h3>
          {selectedProblems.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              description="No active revisions on this date."
            />
          ) : (
            <ul className="space-y-2">
              {selectedProblems.map((problem) => (
                <li key={problem.id}>
                  <Link
                    href={`/problems/${problem.id}`}
                    className={`${cardClass} flex items-center justify-between gap-3 px-4 py-3 transition hover:border-indigo-300`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {problem.title}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {problem.topic ?? "No topic"} · {problem.stageName}
                      </span>
                    </span>
                    <Badge tone="indigo">{problem.stageName}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-slate-400">
          Tap a date to see its problems.
        </p>
      )}
    </div>
  );
}
