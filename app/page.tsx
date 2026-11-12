import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { I111_INTERVALS } from "@/lib/scheduling/intervals";
import { LandingAuth } from "@/components/landing-auth";
import {
  BarChartIcon,
  CalendarIcon,
  CheckIcon,
  CheckSquareIcon,
  ClockIcon,
  ListIcon,
  SearchIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "i111 Tracker — spaced repetition for coding practice",
  description:
    "Turn every problem you solve into a four-step revision plan: Immediate, 1 Day, 1 Week, 1 Month. Stop solving the same problem twice.",
};

const STAGE_DETAILS: Record<number, { when: string; text: string }> = {
  0: {
    when: "same day",
    text: "Revisit it while it is still warm — sharpen the details you rushed through the first time.",
  },
  1: {
    when: "the next day",
    text: "Re-solve it from scratch tomorrow. Resist the urge to peek at yesterday's solution.",
  },
  2: {
    when: "one week later",
    text: "This is where most solutions quietly die. Reach this stage and the habit is working.",
  },
  3: {
    when: "one month later",
    text: "The final boss. If you can still do it cold, the problem is genuinely yours.",
  },
};

const WHY = [
  {
    title: "Problems fade fast",
    text: "Solving a problem once is not the same as knowing it. Most solutions are gone within a week — and you pay for it in interviews.",
  },
  {
    title: "Timing is the whole trick",
    text: "Revise too soon and nothing sticks. Revise too late and it is gone. Spaced repetition picks the interval for you.",
  },
  {
    title: "Zero planning, all follow-through",
    text: "The schedule is already written for every problem you add. You just open the queue and do the work.",
  },
];

const FEATURES = [
  {
    icon: CheckSquareIcon,
    title: "Today's queue",
    text: "One list holding exactly what is due — no hunting through notes, no guessing what to revise.",
  },
  {
    icon: ClockIcon,
    title: "Honest overdue handling",
    text: "Miss a day and the problem stays put, tagged with how many days late you are. No guilt, just a plan.",
  },
  {
    icon: ListIcon,
    title: "Full revision history",
    text: "Every attempt is logged with the scheduled date, the actual date, and whether you were on time or late.",
  },
  {
    icon: SearchIcon,
    title: "Problem library",
    text: "Search by title, topic or difficulty. Your whole practice history, filterable and in one place.",
  },
  {
    icon: CalendarIcon,
    title: "Calendar view",
    text: "See the month ahead and spot the days where too many revisions land on top of each other.",
  },
  {
    icon: BarChartIcon,
    title: "Statistics",
    text: "Completion rate, on-time ratio and a per-topic breakdown of what actually sticks.",
  },
];

const STATS = [
  { value: "4", label: "revisions per problem" },
  { value: "38", label: "days from solve to complete" },
  { value: "0", label: "reminders to set up" },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-[13px] font-bold tracking-tight text-white shadow-sm ${className}`}
    >
      i111
    </span>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white">
      {/* -------------------------------------------------------------- */}
      {/* Nav                                                          */}
      {/* -------------------------------------------------------------- */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-base font-bold tracking-tight text-slate-900">
              i111 Tracker
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Log in
            </Link>
            <a
              href="#get-started"
              className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Get started
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* ------------------------------------------------------------ */}
        {/* Hero                                                       */}
        {/* ------------------------------------------------------------ */}
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(65%_55%_at_50%_0%,rgba(99,102,241,0.22),transparent_70%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(75%_60%_at_50%_0%,black,transparent)]"
          />

          <div className="mx-auto max-w-3xl px-5 pb-16 pt-16 text-center sm:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              i111 spaced repetition
            </span>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 text-balance sm:text-5xl md:text-6xl">
              Solve it once.
              <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Actually remember it.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 text-pretty">
              Most of the work you do on a coding problem disappears the week
              after you solve it. i111 Tracker turns every problem into a
              four-step revision plan —{" "}
              <span className="font-semibold text-slate-800">
                Immediate, 1 Day, 1 Week, 1 Month
              </span>{" "}
              — so the solution stays where you can reach it.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#get-started"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 sm:w-auto"
              >
                Create your free account
              </a>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                I already have an account
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Free · no credit card · works on your phone
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Why                                                        */}
        {/* ------------------------------------------------------------ */}
        <section className="border-t border-slate-200 bg-slate-50/70 py-20">
          <div className="mx-auto max-w-5xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Why a tracker?
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Solving is the easy half. Remembering is where practice actually
                pays off — and almost nobody schedules it.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {WHY.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600 ring-1 ring-inset ring-indigo-100">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* How it works                                               */}
        {/* ------------------------------------------------------------ */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                The i111 schedule
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                One problem, four revisits, 38 days
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Add a problem the moment you solve it. The tracker hands you the
                next four dates — each one spaced just far enough for the
                memory to fade, and not a day further.
              </p>
            </div>

            <div className="relative mt-16">
              <div
                aria-hidden
                className="absolute left-[12.5%] right-[12.5%] top-[1.0625rem] hidden h-0.5 bg-gradient-to-r from-indigo-300 via-violet-300 to-emerald-300 md:block"
              />
              <ol className="relative space-y-8 md:grid md:grid-cols-4 md:gap-6 md:space-y-0">
                {I111_INTERVALS.map((interval, index) => {
                  const detail = STAGE_DETAILS[interval.stage];
                  return (
                    <li
                      key={interval.stage}
                      className="relative pl-14 md:pl-0 md:text-center"
                    >
                      {index < I111_INTERVALS.length - 1 ? (
                        <span
                          aria-hidden
                          className="absolute left-[1.3125rem] top-10 h-[calc(100%-1.5rem)] w-px bg-slate-200 md:hidden"
                        />
                      ) : null}

                      <span className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25 ring-4 ring-white md:static md:mx-auto">
                        {index + 1}
                      </span>

                      <div className="md:mt-5">
                        <h3 className="text-lg font-bold text-slate-900">
                          {interval.name}
                        </h3>
                        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                          {detail?.when}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">
                          {detail?.text}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="mx-auto mt-12 flex max-w-2xl items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <CheckIcon className="h-4 w-4" />
              </span>
              <p className="text-sm leading-relaxed text-emerald-900">
                <span className="font-semibold">Cycle complete.</span> After the
                1 Month revision the problem is closed and archived — and you
                can start a fresh cycle on it whenever you want to push it
                further.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Features                                                   */}
        {/* ------------------------------------------------------------ */}
        <section className="border-t border-slate-200 bg-slate-50/70 py-20">
          <div className="mx-auto max-w-5xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Everything around the schedule
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                The schedule is the core. The rest is what makes it something
                you will actually keep using.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>

            <dl className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-center shadow-sm"
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-4xl font-black tracking-tight text-indigo-600">
                      {stat.value}
                    </span>
                    <span className="mt-1 block text-sm text-slate-600">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Get started (auth)                                         */}
        {/* ------------------------------------------------------------ */}
        <section
          id="get-started"
          className="relative isolate scroll-mt-20 py-20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_60%_at_50%_100%,rgba(139,92,246,0.16),transparent_70%)]"
          />
          <div className="mx-auto max-w-5xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Try it on your next problem
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Create an account, add the problem you just solved, and let the
                tracker do the remembering for you.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-md">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
                <LandingAuth />
              </div>
              <p className="mt-5 text-center text-xs text-slate-500">
                Your data is private to your account. Passwords are hashed, and
                sessions can be revoked at any time from Settings.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------- */}
      {/* Footer                                                        */}
      {/* -------------------------------------------------------------- */}
      <footer className="border-t border-slate-200 bg-slate-50/70 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <Logo className="h-8 w-8 text-[11px]" />
            <span className="text-sm font-semibold text-slate-700">
              i111 Tracker
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Solve → Add → Immediate → 1 Day → 1 Week → 1 Month.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Sign up
            </Link>
            <a
              href="https://github.com/Cjeet-21/i111-tracker"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-600 transition hover:text-indigo-600"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
