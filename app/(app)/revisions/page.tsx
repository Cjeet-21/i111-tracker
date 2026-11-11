import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getRevisionQueue } from "@/lib/queries/revisions";
import { RevisionCard } from "@/components/revision-card";
import {
  AlertTriangleIcon,
  CheckSquareIcon,
  PlusCircleIcon,
} from "@/components/icons";
import { EmptyState, PageHeader, btnPrimaryClass } from "@/components/ui";
import type { RevisionQueueItem } from "@/types";

export const metadata = { title: "Today's Revisions" };
export const dynamic = "force-dynamic";

function SectionHeading({
  title,
  count,
  tone,
}: {
  title: string;
  count: number;
  tone: "red" | "indigo";
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {tone === "red" ? (
        <AlertTriangleIcon className="h-5 w-5 text-red-500" />
      ) : (
        <CheckSquareIcon className="h-5 w-5 text-indigo-500" />
      )}
      <h2
        className={`text-sm font-semibold uppercase tracking-wide ${
          tone === "red" ? "text-red-600" : "text-indigo-600"
        }`}
      >
        {title}
      </h2>
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
        {count}
      </span>
    </div>
  );
}

function QueueCard({ item }: { item: RevisionQueueItem }) {
  return (
    <RevisionCard
      problemId={item.id}
      title={item.title}
      url={item.url}
      description={item.description}
      topic={item.topic}
      difficulty={item.difficulty}
      solvedAt={item.solvedAt}
      stageName={item.stageName}
      scheduledDate={item.scheduledDate}
      overdueBy={item.overdueBy}
    />
  );
}

export default async function RevisionsPage() {
  const user = await requireUser();
  const { items } = await getRevisionQueue(user.id, user.timezone);

  const overdue = items.filter((item) => item.overdueBy > 0);
  const dueToday = items.filter((item) => item.overdueBy === 0);

  return (
    <div>
      <PageHeader
        title="Today's Revisions"
        subtitle={`${
          items.length
        } ${items.length === 1 ? "problem" : "problems"} to revise — overdue first, then today's`}
      />

      {items.length === 0 ? (
        <EmptyState
          title="Nothing due right now"
          description="Every scheduled revision is complete for today. Add the next problem you solve — its Immediate revision will be scheduled automatically."
          action={
            <Link href="/problems/new" className={btnPrimaryClass}>
              <PlusCircleIcon className="h-4 w-4" />
              Add problem
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 ? (
            <section>
              <SectionHeading
                title="Overdue"
                count={overdue.length}
                tone="red"
              />
              <div className="space-y-3">
                {overdue.map((item) => (
                  <QueueCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : null}

          {dueToday.length > 0 ? (
            <section>
              <SectionHeading
                title="Due today"
                count={dueToday.length}
                tone="indigo"
              />
              <div className="space-y-3">
                {dueToday.map((item) => (
                  <QueueCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
