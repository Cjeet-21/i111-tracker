import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { getRevisionQueue } from "@/lib/queries/revisions";
import {
  AlertTriangleIcon,
  CheckSquareIcon,
  PlusCircleIcon,
} from "@/components/icons";
import {
  Badge,
  PageHeader,
  StatCard,
  btnPrimaryClass,
  btnSecondaryClass,
  cardClass,
} from "@/components/ui";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, queue] = await Promise.all([
    getDashboardStats(user.id, user.timezone),
    getRevisionQueue(user.id, user.timezone),
  ]);

  const dueTotal = stats.dueToday + stats.overdue;
  const preview = queue.items.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={stats.todayLong}
        actions={
          <Link href="/problems/new" className={btnSecondaryClass}>
            <PlusCircleIcon className="h-4 w-4" />
            Add problem
          </Link>
        }
      />

      {/* Primary call to action */}
      <div className="rounded-xl bg-indigo-600 p-5 text-white shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-100">
              Today&rsquo;s Revisions
            </p>
            <p className="mt-1 text-3xl font-bold">
              {dueTotal} {dueTotal === 1 ? "problem" : "problems"}
            </p>
            <p className="mt-1 text-sm text-indigo-100">
              {stats.dueToday} due today
              {stats.overdue > 0 ? ` · ${stats.overdue} overdue` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/revisions"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
            >
              <CheckSquareIcon className="h-4 w-4" />
              {dueTotal > 0 ? "Start today's revision" : "Open revision queue"}
            </Link>
            {stats.overdue > 0 ? (
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-amber-200">
                <AlertTriangleIcon className="h-4 w-4" />
                {stats.overdue} overdue — still in your queue
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Due today"
          value={stats.dueToday}
          tone="indigo"
          hint="Scheduled for today"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          tone={stats.overdue > 0 ? "red" : "slate"}
          hint="Past due, never lost"
        />
        <StatCard label="Total problems" value={stats.totalProblems} />
        <StatCard
          label="Active cycles"
          value={stats.activeCycles}
          tone="amber"
          hint="i111 in progress"
        />
        <StatCard
          label="Completed cycles"
          value={stats.completedCycles}
          tone="emerald"
          hint="i111 finished"
        />
        <StatCard
          label="Revisions today"
          value={stats.revisionsToday}
          hint={`${stats.revisionsThisWeek} this week`}
        />
        <StatCard
          label="Solved this week"
          value={stats.solvedThisWeek}
          hint={`${stats.solvedThisMonth} this month`}
        />
        <StatCard
          label="Revisions this month"
          value={stats.revisionsThisMonth}
          hint="All stages"
        />
      </div>

      {/* Today's queue preview */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Up first
          </h2>
          <Link
            href="/revisions"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            View all
          </Link>
        </div>

        {preview.length === 0 ? (
          <div className={`${cardClass} p-6 text-center`}>
            <p className="font-semibold text-slate-800">All caught up</p>
            <p className="mt-1 text-sm text-slate-500">
              Nothing to revise right now. Add the next problem you solve and
              the i111 schedule starts automatically.
            </p>
            <Link
              href="/problems/new"
              className={`${btnPrimaryClass} mt-4 inline-flex`}
            >
              <PlusCircleIcon className="h-4 w-4" />
              Add problem
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {preview.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/problems/${item.id}`}
                  className={`${cardClass} flex items-center justify-between gap-3 px-4 py-3 transition hover:border-indigo-300`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {item.stageName}
                      {item.nextRevisionDate
                        ? ` · due ${item.nextRevisionDate}`
                        : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {item.overdueBy > 0 ? (
                      <Badge tone="red">{item.overdueBy}d overdue</Badge>
                    ) : (
                      <Badge tone="indigo">Today</Badge>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
