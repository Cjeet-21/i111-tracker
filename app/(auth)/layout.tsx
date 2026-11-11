export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          i111
        </span>
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Revision Tracker
        </span>
      </div>
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {children}
      </div>
      <p className="mt-6 max-w-sm text-center text-xs text-slate-500">
        Solve → Add → Immediate → 1 Day → 1 Week → 1 Month. The schedule is
        calculated for you.
      </p>
    </div>
  );
}
