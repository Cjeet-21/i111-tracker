/** Only same-site absolute paths are valid post-login redirect targets. */
export function sanitizeNext(raw: unknown): string {
  if (
    typeof raw === "string" &&
    raw.startsWith("/") &&
    !raw.startsWith("//") &&
    !raw.includes("\\")
  ) {
    return raw;
  }
  return "/dashboard";
}
