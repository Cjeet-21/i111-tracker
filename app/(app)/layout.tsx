import { requireUser } from "@/lib/auth/session";
import { Shell } from "@/components/shell";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <Shell userName={user.name ?? "You"} userEmail={user.email}>
      {children}
    </Shell>
  );
}
