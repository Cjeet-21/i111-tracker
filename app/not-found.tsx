import Link from "next/link";
import { btnPrimaryClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-5xl font-bold text-indigo-600">404</p>
      <h1 className="mt-3 text-xl font-semibold text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you are looking for does not exist or was moved.
      </p>
      <Link href="/dashboard" className={`${btnPrimaryClass} mt-6`}>
        Back to dashboard
      </Link>
    </div>
  );
}
