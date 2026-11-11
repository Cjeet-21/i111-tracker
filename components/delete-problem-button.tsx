"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProblemAction } from "@/lib/actions/problems";
import { TrashIcon } from "@/components/icons";
import { btnDangerClass } from "@/components/ui";

export function DeleteProblemButton({
  problemId,
  title,
}: {
  problemId: string;
  title: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        className={btnDangerClass}
        onClick={() => {
          const confirmed = window.confirm(
            `Delete "${title}" and its entire revision history? This cannot be undone.`
          );
          if (!confirmed) return;
          startTransition(async () => {
            const result = await deleteProblemAction(problemId);
            if (result.success) {
              router.push("/problems");
              router.refresh();
            } else {
              setError(result.error);
            }
          });
        }}
      >
        <TrashIcon className="h-4 w-4" />
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
