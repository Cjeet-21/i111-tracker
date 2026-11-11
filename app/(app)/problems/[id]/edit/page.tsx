import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toPlainDateString, todayInTimezone } from "@/lib/dates";
import { ProblemForm } from "@/components/problem-form";
import { ChevronLeftIcon } from "@/components/icons";
import { PageHeader, cardClass } from "@/components/ui";

export const metadata = { title: "Edit Problem" };
export const dynamic = "force-dynamic";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const problem = await prisma.problem.findFirst({
    where: { id, userId: user.id },
  });
  if (!problem) notFound();

  const today = toPlainDateString(todayInTimezone(user.timezone));

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/problems/${problem.id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to problem
      </Link>

      <div className="mt-3">
        <PageHeader
          title="Edit Problem"
          subtitle="Changing the solve date before the first revision resets the schedule."
        />
      </div>

      <div className={`${cardClass} p-5 md:p-6`}>
        <ProblemForm
          mode="edit"
          defaultSolvedAt={today}
          values={{
            id: problem.id,
            title: problem.title,
            url: problem.url ?? "",
            description: problem.description ?? "",
            topic: problem.topic ?? "",
            difficulty: problem.difficulty ?? "",
            solvedAt: toPlainDateString(problem.solvedAt),
          }}
        />
      </div>
    </div>
  );
}
