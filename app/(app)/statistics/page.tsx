import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getStatistics } from "@/lib/queries/statistics";
import { PageHeader, StatCard, btnPrimaryClass, cardClass } from "@/components/ui";
import { PlusCircleIcon } from "@/components/icons";

export const metadata = { title: "Statistics" };
export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const user = await requireUser();
  const stats = await getStatistics(user.id, user.timezone);

  const maxStageCount = Math.max(1, ...stats.byStage.map((s) => s.count));
  const maxTopicCount = Math.max(1, ...stats.topTopics.map((t) => t.count));

  return (
    <div>
      <PageHeader
        title="Statistics"
        subtitle="Computed from your database records — today in your time zone"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total problems" value={stats.totalProblems} />
        <StatCard
          label="Due today"
          value={stats.dueToday}
          tone="indigo"
          hint="Right now"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          tone={stats.overdue > 0 ? "red" : "slate"}
        />
        <StatCard
          label="Active cycles"
          value={stats.activeCycles}
          tone="amber"
        />
        <StatCard
          label="Completed cycles"
          value={stats.completedCycles}
          tone="emerald"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Solved this week"
          value={stats.solvedThisWeek}
          hint="Last 7 days"
        />
        <StatCard
          label="Solved this month"
          value={stats.solvedThisMonth}
          hint="Current month"
        />
        <StatCard
          label="Revisions today"
          value={stats.revisionsToday}
          hint="All stages"
        />
        <StatCard
          label="Revisions this week"
          value={stats.revisionsThisWeek}
          hint="Last 7 days"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Revisions this month + stage distribution */}
        <div className={`${cardClass} p-5`}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Revisions this month
            </h2>
            <span className="text-2xl font-bold text-slate-900">
              {stats.revisionsThisMonth}
            </span>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-slate-700">
            Active cycles by stage
          </h3>
          <ul className="mt-3 space-y-3">
            {stats.byStage.map((stage) => (
              <li key={stage.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{stage.stageName}</span>
                  <span className="font-semibold text-slate-800">
                    {stage.count}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.round(
                        (stage.count / maxStageCount) * 100
                      )}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Topics */}
        <div className={`${cardClass} p-5`}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Top topics
          </h2>
          {stats.topTopics.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Tag your problems with topics to see this breakdown.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {stats.topTopics.map((topic) => (
                <li key={topic.topic}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{topic.topic}</span>
                    <span className="font-semibold text-slate-800">
                      {topic.count}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-sky-500"
                      style={{
                        width: `${Math.round(
                          (topic.count / maxTopicCount) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4">
            <Link href="/problems/new" className={btnPrimaryClass}>
              <PlusCircleIcon className="h-4 w-4" />
              Add problem
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
