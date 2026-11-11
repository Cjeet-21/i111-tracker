import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getProblemDetail } from "@/lib/queries/problems";
import { I111Progress } from "@/components/i111-progress";
import { MarkRevisedButton } from "@/components/mark-revised-button";
import { DeleteProblemButton } from "@/components/delete-problem-button";
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
  PencilIcon,
} from "@/components/icons";
import {
  Badge,
  btnSecondaryClass,
  cardClass,
  difficultyTone,
} from "@/components/ui";

export const metadata = { title: "Problem" };
export const dynamic = "force-dynamic";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const problem = await getProblemDetail(user.id, id, user.timezone);
  if (!problem) notFound();

  const infoRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );

  return (
    <div>
      <Link
        href="/problems"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        All problems
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {problem.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {problem.topic ? <Badge tone="sky">{problem.topic}</Badge> : null}
            {problem.difficulty ? (
              <Badge tone={difficultyTone(problem.difficulty)}>
                {problem.difficulty.toLowerCase()}
              </Badge>
            ) : null}
            <Badge tone="indigo">{problem.stageName}</Badge>
            {problem.status === "COMPLETED" ? (
              <Badge tone="emerald">Cycle completed</Badge>
            ) : problem.overdueBy > 0 ? (
              <Badge tone="red">{problem.overdueBy}d overdue</Badge>
            ) : problem.dueToday ? (
              <Badge tone="indigo">Due today</Badge>
            ) : (
              <Badge tone="slate">Scheduled</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {problem.url ? (
            <a
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className={btnSecondaryClass}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Open problem
            </a>
          ) : null}
          <Link href={`/problems/${problem.id}/edit`} className={btnSecondaryClass}>
            <PencilIcon className="h-4 w-4" />
            Edit
          </Link>
          <DeleteProblemButton problemId={problem.id} title={problem.title} />
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Details */}
        <div className={`${cardClass} p-5 lg:col-span-2`}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Details
          </h2>

          {problem.description ? (
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
              {problem.description}
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-slate-400">
              No description.
            </p>
          )}

          <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
            {problem.url
              ? infoRow(
                  "URL",
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-indigo-600 hover:underline"
                  >
                    {problem.url}
                  </a>
                )
              : null}
            {infoRow("Topic", problem.topic ?? "—")}
            {infoRow(
              "Difficulty",
              problem.difficulty ? problem.difficulty.toLowerCase() : "—"
            )}
            {infoRow("Date solved", problem.solvedAt)}
            {infoRow("Current stage", problem.stageName)}
            {infoRow(
              "Next revision",
              problem.status === "COMPLETED"
                ? "—"
                : problem.nextRevisionDate ?? "—"
            )}
            {infoRow(
              "Status",
              problem.status === "ACTIVE" ? "Active cycle" : "Completed"
            )}
          </dl>
        </div>

        {/* Progress */}
        <div className={`${cardClass} p-5`}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            i111 progress
          </h2>
          <div className="mt-4">
            <I111Progress
              currentStage={problem.currentStage}
              status={problem.status}
              history={problem.history}
            />
          </div>

          {problem.status === "ACTIVE" ? (
            <div className="mt-2">
              {problem.overdueBy > 0 ? (
                <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  <AlertTriangleIcon className="h-4 w-4 shrink-0" />
                  {problem.overdueBy}{" "}
                  {problem.overdueBy === 1 ? "day" : "days"} overdue — next
                  interval counts from today.
                </p>
              ) : null}
              <MarkRevisedButton problemId={problem.id} />
            </div>
          ) : (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              All four revisions completed. Cycle closed.
            </p>
          )}
        </div>
      </div>

      {/* Revision history */}
      <div className={`mt-5 ${cardClass} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Revision history
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Permanent record — every completed revision with its scheduled and
            actual completion time.
          </p>
        </div>

        {problem.history.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            No revisions recorded yet. Complete the Immediate revision to start
            the cycle.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Stage</th>
                  <th className="px-5 py-2.5 font-semibold">Scheduled</th>
                  <th className="px-5 py-2.5 font-semibold">Completed</th>
                  <th className="px-5 py-2.5 text-right font-semibold">
                    Punctuality
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {problem.history.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {entry.stageName}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {entry.scheduledDate}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {entry.completedAt}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {entry.wasLate ? (
                        <Badge tone="amber">
                          {entry.lateBy}{" "}
                          {entry.lateBy === 1 ? "day" : "days"} late
                        </Badge>
                      ) : (
                        <Badge tone="emerald">On time</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
