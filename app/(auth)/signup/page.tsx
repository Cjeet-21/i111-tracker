import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { sanitizeNext } from "@/lib/navigation";

export const metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = sanitizeNext(params.next);

  const user = await getCurrentUser();
  if (user) redirect(next);

  return <AuthForm mode="signup" next={next} />;
}
