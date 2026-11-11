// One-off: (re)build .env for Neon.
// Sources: Neon CLI (authoritative connection strings) + the pre-Neon backup (AUTH_SECRET).
// Never prints secret values.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const envPath = new URL(".env", root);
const backupPath = new URL(".env.backup-pre-neon", root);

const PROJECT_ID = "solitary-bread-30280496";

// The global npm bin dir is not always on the child process PATH.
const neonBin = [process.env.APPDATA + "\\npm\\neon.cmd", "neon"].find((candidate) => {
  try {
    execFileSync("cmd", ["/c", "where", candidate], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
});

function neonConnectionString({ pooled }) {
  const args = [
    "connection-string",
    "--project-id",
    PROJECT_ID,
    "--branch",
    "production",
    "--prisma",
  ];
  if (pooled) args.push("--pooled");
  return execFileSync(neonBin, args, { encoding: "utf8", shell: true }).trim();
}

// Keep the app's own secret across the Neon rewrite.
let authSecret = "";
let appUrl = "http://localhost:3000";
if (existsSync(backupPath)) {
  const backup = readFileSync(backupPath, "utf8");
  const pick = (key) => {
    const m = backup.match(new RegExp(`^${key}=(.*)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  };
  authSecret = pick("AUTH_SECRET");
  appUrl = pick("NEXT_PUBLIC_APP_URL") || appUrl;
}
if (!authSecret) {
  authSecret = execFileSync(
    "node",
    ["-e", "console.log(require('crypto').randomBytes(32).toString('base64url'))"],
    { encoding: "utf8" }
  ).trim();
}

const pooledUrl = neonConnectionString({ pooled: true });
const directUrl = neonConnectionString({ pooled: false });

const u = new URL(pooledUrl);
if (!u.hostname.includes("-pooler")) throw new Error("expected a pooled endpoint");
u.searchParams.set("pgbouncer", "true");
u.searchParams.set("connection_limit", "1");
const runtimeUrl = u.toString();

const d = new URL(directUrl);
d.searchParams.delete("pgbouncer");
d.searchParams.delete("connection_limit");

const content = `# Local environment (git-ignored). Production values live in Vercel.
# Regenerate this file with: node scripts/wire-neon-env.mjs

# Neon (Singapore) - pooled endpoint used by the app at runtime
DATABASE_URL="${runtimeUrl}"

# Neon - direct endpoint used by Prisma Migrate / Prisma Studio
DIRECT_URL="${d.toString()}"

# Session cookie signing secret
AUTH_SECRET="${authSecret}"

# Canonical URL of the app
NEXT_PUBLIC_APP_URL="${appUrl}"
`;

writeFileSync(envPath, content, "utf8");

console.log("OK: .env rebuilt");
console.log("    DATABASE_URL host =", new URL(runtimeUrl).hostname);
console.log("    DIRECT_URL   host =", new URL(directUrl).hostname);
console.log("    AUTH_SECRET length =", authSecret.length);
console.log("    NEXT_PUBLIC_APP_URL =", appUrl);
