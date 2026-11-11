"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOutAction } from "@/lib/actions/auth";
import {
  BarChartIcon,
  CalendarIcon,
  CheckSquareIcon,
  HomeIcon,
  ListIcon,
  LogOutIcon,
  PlusCircleIcon,
  SettingsIcon,
} from "@/components/icons";

interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  mobile?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon, mobile: true },
  {
    href: "/revisions",
    label: "Today's Revisions",
    icon: CheckSquareIcon,
    mobile: true,
  },
  { href: "/problems/new", label: "Add Problem", icon: PlusCircleIcon, mobile: true },
  { href: "/problems", label: "All Problems", icon: ListIcon, mobile: true },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon, mobile: true },
  { href: "/statistics", label: "Statistics", icon: BarChartIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/problems") return pathname === "/problems";
  if (href === "/problems/new") return pathname === "/problems/new";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({
  userName,
  userEmail,
  children,
}: {
  userName: string;
  userEmail: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            i111
          </span>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Revision Tracker
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-4 py-4">
          <p className="truncate text-sm font-semibold text-slate-800">
            {userName}
          </p>
          <p className="truncate text-xs text-slate-500">{userEmail}</p>
          <form action={signOutAction} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOutIcon className="h-4 w-4" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="md:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              i111
            </span>
            <span className="text-sm font-bold text-slate-900">
              Revision Tracker
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/statistics"
              aria-label="Statistics"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <BarChartIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/settings"
              aria-label="Settings"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <SettingsIcon className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5 md:px-8 md:pb-12 md:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV_ITEMS.filter((item) => item.mobile).map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const isAdd = item.href === "/problems/new";
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                isAdd
                  ? "text-indigo-600"
                  : active
                    ? "text-indigo-700"
                    : "text-slate-500"
              }`}
            >
              <span
                className={
                  isAdd
                    ? "flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white"
                    : ""
                }
              >
                <Icon className="h-5 w-5" />
              </span>
              {isAdd ? "Add" : item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
