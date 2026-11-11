"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SearchIcon } from "@/components/icons";
import { btnSecondaryClass, inputClass } from "@/components/ui";

export interface FilterValues {
  q: string;
  topic: string;
  difficulty: string;
  status: string;
  stage: string;
  due: string;
}

const EMPTY: FilterValues = {
  q: "",
  topic: "all",
  difficulty: "all",
  status: "all",
  stage: "all",
  due: "all",
};

export function ProblemFilters({
  initial,
  topics,
}: {
  initial: FilterValues;
  topics: string[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<FilterValues>(initial);
  const [isPending, startTransition] = useTransition();

  function apply(next: FilterValues) {
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.topic !== "all") params.set("topic", next.topic);
    if (next.difficulty !== "all") params.set("difficulty", next.difficulty);
    if (next.status !== "all") params.set("status", next.status);
    if (next.stage !== "all") params.set("stage", next.stage);
    if (next.due !== "all") params.set("due", next.due);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `/problems?${query}` : "/problems");
    });
  }

  function update(patch: Partial<FilterValues>) {
    const next = { ...values, ...patch };
    setValues(next);
    apply(next);
  }

  const hasFilters = Object.keys(EMPTY).some(
    (key) => values[key as keyof FilterValues] !== EMPTY[key as keyof FilterValues]
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply(values);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            value={values.q}
            onChange={(event) => setValues({ ...values, q: event.target.value })}
            placeholder="Search title, topic, or description…"
            aria-label="Search problems"
            className={`${inputClass} pl-9`}
          />
        </div>
        <button type="submit" className={btnSecondaryClass} disabled={isPending}>
          Search
        </button>
      </form>

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        <select
          aria-label="Filter by topic"
          value={values.topic}
          onChange={(event) => update({ topic: event.target.value })}
          className={inputClass}
        >
          <option value="all">All topics</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by difficulty"
          value={values.difficulty}
          onChange={(event) => update({ difficulty: event.target.value })}
          className={inputClass}
        >
          <option value="all">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <select
          aria-label="Filter by status"
          value={values.status}
          onChange={(event) => update({ status: event.target.value })}
          className={inputClass}
        >
          <option value="all">Active + completed</option>
          <option value="ACTIVE">Active only</option>
          <option value="COMPLETED">Completed only</option>
        </select>

        <select
          aria-label="Filter by revision stage"
          value={values.stage}
          onChange={(event) => update({ stage: event.target.value })}
          className={inputClass}
        >
          <option value="all">Any stage</option>
          <option value="0">Immediate</option>
          <option value="1">1 Day</option>
          <option value="2">1 Week</option>
          <option value="3">1 Month</option>
          <option value="4">Completed</option>
        </select>

        <select
          aria-label="Filter by due date"
          value={values.due}
          onChange={(event) => update({ due: event.target.value })}
          className={inputClass}
        >
          <option value="all">Any due date</option>
          <option value="today">Due (incl. overdue)</option>
          <option value="overdue">Overdue only</option>
        </select>
      </div>

      {hasFilters ? (
        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">Filters applied</p>
          <button
            type="button"
            onClick={() => {
              setValues(EMPTY);
              apply(EMPTY);
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}
