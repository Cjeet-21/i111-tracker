"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  pruneExpiredSessions,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  formatZodError,
  loginSchema,
  signupSchema,
} from "@/lib/validation";
import { sanitizeNext } from "@/lib/navigation";

export interface AuthFormState {
  error?: string;
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name: name && name.length > 0 ? name : null,
      passwordHash,
      timezone: "UTC",
    },
  });

  await pruneExpiredSessions();
  await createSession(user.id);
  redirect(sanitizeNext(formData.get("next")));
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Constant-ish work to avoid revealing whether the email exists.
    await verifyPassword(password, "scrypt$16384$8$1$AA==$AA==").catch(
      () => false
    );
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  await pruneExpiredSessions();
  await createSession(user.id);
  redirect(sanitizeNext(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
