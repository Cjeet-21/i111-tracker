"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  changePasswordAction,
  updateSettingsAction,
  type SettingsFormState,
} from "@/lib/actions/settings";
import {
  btnPrimaryClass,
  inputClass,
  labelClass,
} from "@/components/ui";

function Feedback({ state }: { state: SettingsFormState }) {
  if (state.error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {state.error}
      </div>
    );
  }
  if (state.success) {
    return (
      <div
        role="status"
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
      >
        {state.success}
      </div>
    );
  }
  return null;
}

export function ProfileForm({
  defaultName,
  defaultTimezone,
}: {
  defaultName: string;
  defaultTimezone: string;
}) {
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(updateSettingsAction, {});

  const detected =
    typeof Intl !== "undefined" &&
    typeof Intl.DateTimeFormat().resolvedOptions().timeZone === "string"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : null;

  return (
    <form action={formAction} className="space-y-4">
      <h2 className="text-base font-semibold text-slate-900">
        Profile &amp; time zone
      </h2>
      <Feedback state={state} />

      <div>
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          maxLength={120}
          defaultValue={defaultName}
          className={inputClass}
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="timezone" className={labelClass}>
          Time zone
        </label>
        <TimezoneSelect defaultValue={defaultTimezone} detected={detected} />
        <p className="mt-1 text-xs text-slate-500">
          &ldquo;Due today&rdquo; and overdue are calculated in this zone.
        </p>
      </div>

      <button type="submit" disabled={pending} className={btnPrimaryClass}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function TimezoneSelect({
  defaultValue,
  detected,
}: {
  defaultValue: string;
  detected: string | null;
}) {
  const [value, setValue] = useState(defaultValue);

  const zones: string[] =
    typeof Intl !== "undefined" &&
    typeof (Intl as { supportedValuesOf?: (k: string) => string[] })
      .supportedValuesOf === "function"
      ? (Intl as unknown as { supportedValuesOf: (k: string) => string[] })
          .supportedValuesOf("timeZone")
      : [
          "UTC",
          "America/New_York",
          "America/Chicago",
          "America/Denver",
          "America/Los_Angeles",
          "Europe/London",
          "Europe/Berlin",
          "Europe/Paris",
          "Asia/Kolkata",
          "Asia/Tokyo",
          "Australia/Sydney",
        ];

  if (!zones.includes(value)) zones.unshift(value);

  return (
    <div className="flex gap-2">
      <select
        id="timezone"
        name="timezone"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={inputClass}
      >
        {zones.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
      {detected && detected !== value ? (
        <button
          type="button"
          onClick={() => setValue(detected)}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          title={detected}
        >
          Use mine
        </button>
      ) : null}
    </div>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(changePasswordAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const changed = Boolean(state.success);

  useEffect(() => {
    if (changed && formRef.current) formRef.current.reset();
  }, [changed]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <h2 className="text-base font-semibold text-slate-900">Password</h2>
      <Feedback state={state} />

      <div>
        <label htmlFor="currentPassword" className={labelClass}>
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          maxLength={128}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="newPassword" className={labelClass}>
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500">
          At least 8 characters. Other sessions are signed out.
        </p>
      </div>

      <button type="submit" disabled={pending} className={btnPrimaryClass}>
        {pending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
