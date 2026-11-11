import { z } from "zod";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/lib/auth/password";

const difficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

const difficultySchema = z
  .union([difficultyEnum, z.literal("")])
  .optional()
  .transform((value): "EASY" | "MEDIUM" | "HARD" | undefined =>
    value === "" || value === undefined ? undefined : value
  );

const text = (max: number, min = 0, label = "This field") =>
  z
    .string()
    .trim()
    .min(min, min > 0 ? `${label} is required` : "Invalid value")
    .max(max, `${label} must be at most ${max} characters`);

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(320, "Email is too long")
  .email("Enter a valid email address")
  .transform((s) => s.toLowerCase());

export const passwordSchema = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  )
  .max(
    MAX_PASSWORD_LENGTH,
    `Password must be at most ${MAX_PASSWORD_LENGTH} characters`
  );

export const signupSchema = z.object({
  name: text(120, 0, "Name").optional().or(z.literal("")),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const dateInputSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date (YYYY-MM-DD)");

export const problemSchema = z.object({
  title: text(300, 1, "Title"),
  url: z
    .string()
    .trim()
    .refine((v) => v === "" || v.length <= 2048, "URL is too long")
    .refine((v) => {
      if (v === "") return true;
      try {
        const parsed = new URL(v);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid http(s) URL")
    .optional()
    .transform((v) => (v ? v : null)),
  description: z
    .string()
    .max(5000, "Description must be at most 5000 characters")
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  topic: z
    .string()
    .max(120, "Topic must be at most 120 characters")
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  difficulty: difficultySchema,
  solvedAt: dateInputSchema,
});

export type ProblemInput = z.infer<typeof problemSchema>;

export const settingsSchema = z.object({
  name: text(120, 0, "Name").optional().or(z.literal("")),
  timezone: z.string().trim().min(1, "Time zone is required").max(64),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

/** Flatten a ZodError into a single readable message. */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => issue.message)
    .filter((message, index, all) => all.indexOf(message) === index)
    .join(". ");
}
