"use client";

import { useState } from "react";
import { AuthForm } from "@/components/auth-form";

/**
 * Landing-page sign-up / log-in card. Tabs switch the form in place, so a
 * visitor can try the product without leaving the page.
 */
export function LandingAuth() {
  const [mode, setMode] = useState<"signup" | "login">("signup");

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active
        ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200"
        : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <div className="w-full max-w-md">
      <div
        role="tablist"
        aria-label="Sign up or log in"
        className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => setMode("signup")}
          className={tabClass(mode === "signup")}
        >
          Create account
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => setMode("login")}
          className={tabClass(mode === "login")}
        >
          Log in
        </button>
      </div>

      {/* Remount on switch so the server action and its state stay in sync. */}
      <AuthForm key={mode} mode={mode} variant="embedded" />
    </div>
  );
}
