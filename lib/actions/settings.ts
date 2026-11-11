"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  getCurrentTokenHash,
  requireUser,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  changePasswordSchema,
  formatZodError,
  settingsSchema,
} from "@/lib/validation";
import { isValidTimezone } from "@/lib/dates";

export interface SettingsFormState {
  error?: string;
  success?: string;
}

export async function updateSettingsAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const user = await requireUser();

  const parsed = settingsSchema.safeParse({
    name: formData.get("name") ?? "",
    timezone: formData.get("timezone") ?? "",
  });
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }
  if (!isValidTimezone(parsed.data.timezone)) {
    return { error: "Choose a valid time zone." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name && parsed.data.name.length > 0 ? parsed.data.name : null,
      timezone: parsed.data.timezone,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/revisions");
  revalidatePath("/statistics");
  revalidatePath("/calendar");
  revalidatePath("/problems");
  return { success: "Settings saved." };
}

export async function changePasswordAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword") ?? "",
  });
  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) {
    return { error: "Account not found." };
  }

  const valid = await verifyPassword(
    parsed.data.currentPassword,
    record.passwordHash
  );
  if (!valid) {
    return { error: "Your current password is incorrect." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const currentTokenHash = await getCurrentTokenHash();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    // Sign out every other session; keep the current one alive.
    prisma.session.deleteMany({
      where: {
        userId: user.id,
        ...(currentTokenHash
          ? { tokenHash: { not: currentTokenHash } }
          : {}),
      },
    }),
  ]);

  return { success: "Password changed." };
}
