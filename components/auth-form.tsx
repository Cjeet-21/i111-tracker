"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signInAction,
  signUpAction,
  type AuthFormState,
} from "@/lib/actions/auth";
import { btnPrimaryClass, inputClass, labelClass } from "@/components/ui";

export function AuthForm({
  mode,
  next,
  variant = "page",
}: {
  mode: "login" | "signup";
  next?: string;
  /** "embedded" drops the internal heading and the login/signup cross-link. */
  variant?: "page" | "embedded";
}) {
  const action = mode === "login" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    {}
  );
  const embedded = variant === "embedded";

  return (
    <form action={formAction} className="space-y-4">
      {embedded ? null : (
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "login"
              ? "Sign in to see today's revisions."
              : "Start tracking your practice problems."}
          </p>
        </div>
      )}

      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="next" value={next ?? "/dashboard"} />

      {mode === "signup" ? (
        <div>
          <label htmlFor="name" className={labelClass}>
            Name <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={120}
            className={inputClass}
            placeholder="Ada Lovelace"
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={320}
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : 1}
          maxLength={128}
          autoComplete={
            mode === "signup" ? "new-password" : "current-password"
          }
          className={inputClass}
          placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
        />
      </div>

      <button type="submit" disabled={pending} className={`${btnPrimaryClass} w-full`}>
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </button>

      {embedded ? null : (
        <p className="text-center text-sm text-slate-600">
          {mode === "login" ? (
            <>
              No account yet?{" "}
              <Link
                href={`/signup${next && next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already registered?{" "}
              <Link
                href={`/login${next && next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Log in
              </Link>
            </>
          )}
        </p>
      )}
    </form>
  );
}
