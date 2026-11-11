"use client";

import Link from "next/link";
import { useEffect, useRef, useActionState } from "react";
import {
  createProblemAction,
  updateProblemAction,
  type ProblemFormState,
} from "@/lib/actions/problems";
import {
  btnPrimaryClass,
  btnSecondaryClass,
  inputClass,
  labelClass,
} from "@/components/ui";
import { CheckIcon } from "@/components/icons";

interface ProblemFormProps {
  mode: "create" | "edit";
  defaultSolvedAt: string;
  values?: {
    id: string;
    title: string;
    url: string;
    description: string;
    topic: string;
    difficulty: string;
    solvedAt: string;
  };
}

export function ProblemForm({ mode, defaultSolvedAt, values }: ProblemFormProps) {
  const action = mode === "create" ? createProblemAction : updateProblemAction;
  const [state, formAction, pending] = useActionState<ProblemFormState, FormData>(
    action,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);
  const succeeded = state.success === true;

  useEffect(() => {
    if (succeeded && mode === "create" && formRef.current) {
      formRef.current.reset();
    }
  }, [succeeded, mode, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {mode === "edit" && values ? (
        <input type="hidden" name="problemId" value={values.id} />
      ) : null}

      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </div>
      ) : null}

      {succeeded ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          <p className="flex items-center gap-2 font-semibold">
            <CheckIcon className="h-4 w-4" />
            {state.message ?? "Saved."}
          </p>
          {mode === "create" ? (
            <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              <Link
                href="/revisions"
                className="font-semibold text-emerald-700 underline underline-offset-2"
              >
                Go to today&rsquo;s revisions
              </Link>
              {state.problemId ? (
                <Link
                  href={`/problems/${state.problemId}`}
                  className="font-semibold text-emerald-700 underline underline-offset-2"
                >
                  View problem
                </Link>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label htmlFor="title" className={labelClass}>
          Problem title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={300}
          defaultValue={values?.title ?? ""}
          className={inputClass}
          placeholder="Search in Rotated Sorted Array"
        />
      </div>

      <div>
        <label htmlFor="url" className={labelClass}>
          URL <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="url"
          name="url"
          type="url"
          maxLength={2048}
          defaultValue={values?.url ?? ""}
          className={inputClass}
          placeholder="https://leetcode.com/problems/..."
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description / notes{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={5000}
          defaultValue={values?.description ?? ""}
          className={inputClass}
          placeholder="Find target in a rotated sorted array."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="topic" className={labelClass}>
            Topic <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="topic"
            name="topic"
            type="text"
            maxLength={120}
            defaultValue={values?.topic ?? ""}
            className={inputClass}
            placeholder="Binary Search"
            list="topic-suggestions"
          />
          <datalist id="topic-suggestions">
            <option value="Binary Search" />
            <option value="Two Pointers" />
            <option value="Dynamic Programming" />
            <option value="Graph" />
            <option value="Greedy" />
            <option value="Stack" />
            <option value="Linked List" />
            <option value="Tree" />
            <option value="Sorting" />
            <option value="Backtracking" />
          </datalist>
        </div>

        <div>
          <label htmlFor="difficulty" className={labelClass}>
            Difficulty{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={values?.difficulty ?? ""}
            className={inputClass}
          >
            <option value="">Not set</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="solvedAt" className={labelClass}>
          Date solved <span className="text-red-500">*</span>
        </label>
        <input
          id="solvedAt"
          name="solvedAt"
          type="date"
          required
          max={defaultSolvedAt}
          defaultValue={values?.solvedAt ?? defaultSolvedAt}
          className={`${inputClass} max-w-[14rem]`}
        />
        <p className="mt-1 text-xs text-slate-500">
          The Immediate revision is scheduled for this date automatically.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={pending} className={btnPrimaryClass}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Add problem"
              : "Save changes"}
        </button>
        {mode === "edit" ? (
          <Link href={`/problems/${values?.id ?? ""}`} className={btnSecondaryClass}>
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}
