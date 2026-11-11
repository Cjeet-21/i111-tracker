import { describe, expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing (scrypt)", () => {
  test("hash verifies against the original password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(
      true
    );
  });

  test("wrong password fails", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  test("hashes are salted — same password, different hashes", async () => {
    const a = await hashPassword("same password here");
    const b = await hashPassword("same password here");
    expect(a).not.toBe(b);
  });

  test("rejects malformed stored hashes instead of throwing", async () => {
    expect(await verifyPassword("whatever", "not-a-hash")).toBe(false);
    expect(await verifyPassword("whatever", "scrypt$x$y$z$AA==$AA==")).toBe(
      false
    );
    expect(await verifyPassword("whatever", "")).toBe(false);
  });

  test("enforces password length on hashing", async () => {
    await expect(hashPassword("short")).rejects.toThrow(RangeError);
    await expect(hashPassword("x".repeat(200))).rejects.toThrow(RangeError);
  });
});
