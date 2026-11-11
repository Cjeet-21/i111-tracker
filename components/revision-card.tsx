"use client";

import Link from "next/link";
import { AlertTriangleIcon, ExternalLinkIcon } from "@/components/icons";
import {
  Badge,
  btnSecondaryClass,
  cardClass,
  difficultyTone,
} from "@/components/ui";
import { MarkRevisedButton } from "@/components/mark-revised-button";

export function RevisionCard({
  problemId,
  title,
  url,
  description,
  topic,
  difficulty,
  solvedAt,
  stageName,
  scheduledDate,
  overdueBy,
}: {
  problemId: string;
  title: string;
  url: string | null;
  description: string | null;
  topic: string | null;
  difficulty: string | null;
  solvedAt: string;
  stageName: string;
  scheduledDate: string;
  overdueBy: number;
}) {
  return (
    <article className={`${cardClass} p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/problems/${problemId}`}
            className="text-base font-semibold text-slate-900 hover:text-indigo-700"
          >
            {title}
          </Link>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topic ? <Badge tone="sky">{topic}</Badge> : null}
            {difficulty ? (
              <Badge tone={difficultyTone(difficulty)}>
                {difficulty.toLowerCase()}
              </Badge>
            ) : null}
            <Badge tone="indigo">Revision: {stageName}</Badge>
          </div>
        </div>
        {overdueBy > 0 ? (
          <Badge tone="red">
            <AlertTriangleIcon className="mr-1 h-3.5 w-3.5" />
            {overdueBy} {overdueBy === 1 ? "day" : "days"} overdue
          </Badge>
        ) : null}
      </div>

      {description ? (
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      ) : null}

      <dl className="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-slate-400">Originally solved:</dt>
          <dd className="font-medium text-slate-700">{solvedAt}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-400">Scheduled:</dt>
          <dd className="font-medium text-slate-700">{scheduledDate}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={btnSecondaryClass}
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Open problem
          </a>
        ) : (
          <Link href={`/problems/${problemId}`} className={btnSecondaryClass}>
            View details
          </Link>
        )}
        <MarkRevisedButton problemId={problemId} />
      </div>
    </article>
  );
}
