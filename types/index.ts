/** Shared DTO types passed from server components to the UI. */

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ProblemStatus = "ACTIVE" | "COMPLETED";

export interface ProblemListItem {
  id: string;
  title: string;
  url: string | null;
  topic: string | null;
  difficulty: Difficulty | null;
  /** `YYYY-MM-DD` */
  solvedAt: string;
  currentStage: number;
  stageName: string;
  /** `YYYY-MM-DD`, null when completed */
  nextRevisionDate: string | null;
  status: ProblemStatus;
  /** Whole days past due (0 when not overdue) */
  overdueBy: number;
  dueToday: boolean;
}

export interface RevisionQueueItem extends ProblemListItem {
  description: string | null;
  /** `YYYY-MM-DD` of the scheduled revision */
  scheduledDate: string;
}

export interface DashboardStats {
  today: string;
  todayLong: string;
  dueToday: number;
  overdue: number;
  totalProblems: number;
  solvedThisWeek: number;
  solvedThisMonth: number;
  activeCycles: number;
  completedCycles: number;
  revisionsToday: number;
  revisionsThisWeek: number;
  revisionsThisMonth: number;
}

export interface RevisionHistoryItem {
  id: string;
  stage: number;
  stageName: string;
  /** `YYYY-MM-DD` */
  scheduledDate: string;
  /** e.g. "Sep 21, 2026, 10:31 AM" in the user's time zone */
  completedAt: string;
  wasLate: boolean;
  /** Days between the scheduled date and the actual completion date */
  lateBy: number;
}

export interface ProblemDetail {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  topic: string | null;
  difficulty: Difficulty | null;
  /** `YYYY-MM-DD` */
  solvedAt: string;
  currentStage: number;
  stageName: string;
  /** `YYYY-MM-DD` or null */
  nextRevisionDate: string | null;
  status: ProblemStatus;
  overdueBy: number;
  dueToday: boolean;
  /** `YYYY-MM-DD` of the cycle start */
  cycleStartedOn: string;
  history: RevisionHistoryItem[];
}

export interface CalendarDayCell {
  /** `YYYY-MM-DD` */
  date: string;
  dayOfMonth: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  count: number;
}

export interface CalendarMonthView {
  /** `YYYY-MM` */
  monthKey: string;
  /** e.g. "September 2026" */
  label: string;
  /** `YYYY-MM` of previous/next month */
  previousMonthKey: string;
  nextMonthKey: string;
  /** Mon..Sun grid (weeks * 7 cells) */
  weeks: CalendarDayCell[][];
}

export interface StageStat {
  stage: number;
  stageName: string;
  count: number;
}

export interface TopicStat {
  topic: string;
  count: number;
}

export interface StatisticsView {
  totalProblems: number;
  solvedThisWeek: number;
  solvedThisMonth: number;
  revisionsToday: number;
  revisionsThisWeek: number;
  revisionsThisMonth: number;
  activeCycles: number;
  completedCycles: number;
  dueToday: number;
  overdue: number;
  byStage: StageStat[];
  topTopics: TopicStat[];
}

export type ActionResult<T = Record<string, never>> =
  | ({ success: true } & T)
  | { success: false; error: string };
