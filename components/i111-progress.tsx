import type { RevisionHistoryItem } from "@/types";
import { I111_INTERVALS } from "@/lib/scheduling/intervals";
import { CheckIcon } from "@/components/icons";

/**
 * Vertical i111 progress indicator:
 *   ✓ Immediate  ↓  ✓ 1 Day  ↓  ● 1 Week  ↓  ○ 1 Month
 * ✓ = completed, ● = current, ○ = upcoming.
 */
export function I111Progress({
  currentStage,
  status,
  history,
}: {
  currentStage: number;
  status: "ACTIVE" | "COMPLETED";
  history: RevisionHistoryItem[];
}) {
  const completedStages = new Set(history.map((entry) => entry.stage));

  return (
    <ol className="space-y-0">
      {I111_INTERVALS.map((interval, index) => {
        const done =
          status === "COMPLETED" ||
          completedStages.has(interval.stage) ||
          interval.stage < currentStage;
        const current =
          status === "ACTIVE" && interval.stage === currentStage;
        const entry = history.find((h) => h.stage === interval.stage);
        const isLast = index === I111_INTERVALS.length - 1;

        return (
          <li key={interval.stage}>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ${
                    done
                      ? "bg-emerald-600 text-white ring-emerald-200"
                      : current
                        ? "bg-indigo-600 text-white ring-indigo-200"
                        : "bg-white text-slate-400 ring-slate-200"
                  }`}
                  aria-label={
                    done ? "completed" : current ? "current stage" : "upcoming"
                  }
                >
                  {done ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : current ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full border border-slate-300" />
                  )}
                </span>
                {!isLast ? (
                  <span
                    className={`my-1 w-px flex-1 ${
                      done ? "bg-emerald-300" : "bg-slate-200"
                    }`}
                    aria-hidden
                  />
                ) : null}
              </div>

              <div className="pb-4">
                <p
                  className={`text-sm font-semibold ${
                    done
                      ? "text-slate-900"
                      : current
                        ? "text-indigo-700"
                        : "text-slate-400"
                  }`}
                >
                  {interval.name}
                  {current ? (
                    <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-600 ring-1 ring-inset ring-indigo-200">
                      Current
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {done && entry
                    ? `Completed ${entry.completedAt}`
                    : current
                      ? "Next revision due now"
                      : status === "COMPLETED"
                        ? "Completed"
                        : "Upcoming"}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
