import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listProblems } from "@/lib/queries/problems";
import { ProblemFilters, type FilterValues } from "@/components/problem-filters";
import {
  Badge,
  EmptyState,
  PageHeader,
  btnPrimaryClass,
  difficultyTone,
} from "@/components/ui";
import { PlusCircleIcon } from "@/components/icons";
import type { ProblemListItem } from "@/types";

export const metadata = { title: "All Problems" };
export const dynamic = "force-dynamic";

function asString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function statusBadge(problem: ProblemListItem) {
  if (problem.status === "COMPLETED") {
    return <Badge tone="emerald">Completed</Badge>;
  }
  if (problem.overdueBy > 0) {
    return <Badge tone="red">{problem.overdueBy}d overdue</Badge>;
  }
  if (problem.dueToday) {
    return <Badge tone="indigo">Due today</Badge>;
  }
  return <Badge tone="slate">Scheduled</Badge>;
}

function ProblemRow({ problem }: { problem: ProblemListItem }) {
  return (
    <li>
      <Link
        href={`/problems/${problem.id}`}
        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 md:flex-row md:items-center md:justify-between"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {problem.title}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {problem.topic ? <Badge tone="sky">{problem.topic}</Badge> : null}
            {problem.difficulty ? (
              <Badge tone={difficultyTone(problem.difficulty)}>
                {problem.difficulty.toLowerCase()}
              </Badge>
            ) : null}
            <Badge tone="indigo">{problem.stageName}</Badge>
            {statusBadge(problem)}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 md:text-right">
          <span>
            <span className="block text-slate-400">Solved</span>
            <span className="font-medium text-slate-700">
              {problem.solvedAt}
            </span>
          </span>
          <span>
            <span className="block text-slate-400">Next revision</span>
            <span className="font-medium text-slate-700">
              {problem.nextRevisionDate ?? "—"}
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    topic?: string;
    difficulty?: string;
    status?: string;
    stage?: string;
    due?: string;
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const filters: FilterValues = {
    q: asString(params.q),
    topic: asString(params.topic) || "all",
    difficulty: asString(params.difficulty) || "all",
    status: asString(params.status) || "all",
    stage: asString(params.stage) || "all",
    due: asString(params.due) || "all",
  };

  const { items, topics, totalCount } = await listProblems(
    user.id,
    filters,
    user.timezone
  );

  return (
    <div>
      <PageHeader
        title="All Problems"
        subtitle={`${items.length} of ${totalCount} ${
          totalCount === 1 ? "problem" : "problems"
        }`}
        actions={
          <Link href="/problems/new" className={btnPrimaryClass}>
            <PlusCircleIcon className="h-4 w-4" />
            Add problem
          </Link>
        }
      />

      <ProblemFilters initial={filters} topics={topics} />

      <div className="mt-4">
        {items.length === 0 ? (
          <EmptyState
            title={totalCount === 0 ? "No problems yet" : "No matches"}
            description={
              totalCount === 0
                ? "Add your first problem to start the i111 revision cycle."
                : "Try a different search or clear the filters."
            }
            action={
              totalCount === 0 ? (
                <Link href="/problems/new" className={btnPrimaryClass}>
                  <PlusCircleIcon className="h-4 w-4" />
                  Add problem
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {items.map((problem) => (
              <ProblemRow key={problem.id} problem={problem} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
