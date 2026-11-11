import { requireUser } from "@/lib/auth/session";
import { signOutAction } from "@/lib/actions/auth";
import { PasswordForm, ProfileForm } from "@/components/settings-forms";
import {
  I111_INTERVALS,
} from "@/lib/scheduling/intervals";
import {
  LogOutIcon,
} from "@/components/icons";
import { PageHeader, btnSecondaryClass, cardClass } from "@/components/ui";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle={user.email}
      />

      <div className="grid gap-5">
        <div className={`${cardClass} p-5`}>
          <ProfileForm
            defaultName={user.name ?? ""}
            defaultTimezone={user.timezone}
          />
        </div>

        <div className={`${cardClass} p-5`}>
          <PasswordForm />
        </div>

        <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 p-5`}>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Signed in as {user.name ?? user.email}
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <form action={signOutAction}>
            <button type="submit" className={btnSecondaryClass}>
              <LogOutIcon className="h-4 w-4" />
              Log out
            </button>
          </form>
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="text-base font-semibold text-slate-900">
            How scheduling works
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            You never calculate dates. Each revision is scheduled from the day
            you actually complete the previous one — late revisions simply
            shift the rest of the cycle.
          </p>
          <ol className="mt-3 space-y-1.5 text-sm text-slate-700">
            {I111_INTERVALS.map((interval, index) => (
              <li key={interval.stage} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 ring-1 ring-inset ring-indigo-200">
                  {index + 1}
                </span>
                <span className="font-medium">{interval.name}</span>
                <span className="text-slate-400">
                  {interval.days === 0
                    ? "— on the day you solve it"
                    : `+${interval.days} days after the previous revision`}
                </span>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600 ring-1 ring-inset ring-emerald-200">
                ✓
              </span>
              <span className="font-medium">Cycle completed</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
