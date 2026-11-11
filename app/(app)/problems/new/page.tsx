import { requireUser } from "@/lib/auth/session";
import { toPlainDateString, todayInTimezone } from "@/lib/dates";
import { ProblemForm } from "@/components/problem-form";
import { PageHeader, cardClass } from "@/components/ui";

export const metadata = { title: "Add Problem" };
export const dynamic = "force-dynamic";

export default async function NewProblemPage() {
  const user = await requireUser();
  const today = toPlainDateString(todayInTimezone(user.timezone));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Add Problem"
        subtitle="The i111 schedule is created automatically: Immediate → 1 Day → 1 Week → 1 Month."
      />
      <div className={`${cardClass} p-5 md:p-6`}>
        <ProblemForm mode="create" defaultSolvedAt={today} />
      </div>
    </div>
  );
}
