"use client";

import { useActionState } from "react";
import { markRevisedAction } from "@/lib/actions/revisions";
import type { MarkRevisedState } from "@/lib/actions/revisions";
import { CheckIcon } from "@/components/icons";
import { btnPrimaryClass } from "@/components/ui";

export function MarkRevisedButton({ problemId }: { problemId: string }) {
  const [state, formAction, pending] = useActionState<
    MarkRevisedState,
    FormData
  >(markRevisedAction, null);

  if (state?.success) {
    return (
      <div
        role="status"
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
      >
        <p className="flex items-center gap-2 font-semibold">
          <CheckIcon className="h-4 w-4" />
          {state.completedStageName} revision recorded
        </p>
        <p className="mt-0.5 text-emerald-700">
          {state.cycleCompleted
            ? "i111 cycle completed."
            : `${state.nextStageName} scheduled for ${state.nextDate}.`}
        </p>
      </div>
    );
  }

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="problemId" value={problemId} />
        <button type="submit" disabled={pending} className={btnPrimaryClass}>
          <CheckIcon className="h-4 w-4" />
          {pending ? "Saving…" : "Mark as revised"}
        </button>
      </form>
      {state && !state.success ? (
        <p
          role="alert"
          className="mt-2 text-sm text-red-600"
        >
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
