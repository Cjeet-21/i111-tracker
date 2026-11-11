#!/usr/bin/env node
/**
 * Zero-config local PostgreSQL for development.
 *
 * Uses the `embedded-postgres` package (real PostgreSQL binaries, no Docker,
 * no admin rights needed). Data persists in ./.local-db across restarts and
 * is git-ignored.
 *
 *   npm run db:local            # start (Ctrl+C to stop)
 *   npm run db:local -- --reset # wipe data and start fresh
 *
 * Connection string printed at startup goes into .env as DATABASE_URL.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const databaseDir = path.join(root, ".local-db");

const PORT = Number(process.env.DEV_DB_PORT || 55432);
const USER = process.env.DEV_DB_USER || "postgres";
const PASSWORD = process.env.DEV_DB_PASSWORD || "postgres";
const DB_NAME = process.env.DEV_DB_NAME || "i111";

if (process.argv.includes("--reset") && fs.existsSync(databaseDir)) {
  fs.rmSync(databaseDir, { recursive: true, force: true });
  console.log("Removed existing data directory.");
}

const { default: EmbeddedPostgres } = await import("embedded-postgres");

const pg = new EmbeddedPostgres({
  databaseDir,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
});

async function main() {
  try {
    await pg.initialise();
    console.log("Initialised new PostgreSQL cluster.");
  } catch (error) {
    if (!fs.existsSync(path.join(databaseDir, "PG_VERSION"))) {
      throw error;
    }
  }

  await pg.start();

  try {
    await pg.createDatabase(DB_NAME);
    console.log(`Created database "${DB_NAME}".`);
  } catch {
    // Database already exists — fine.
  }

  const url = `postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DB_NAME}?schema=public`;
  console.log("");
  console.log("PostgreSQL is running.");
  console.log(`  DATABASE_URL=${url}`);
  console.log(`  DIRECT_URL=${url}`);
  console.log("");
  console.log("Put those two lines in .env, then run: npm run db:migrate");
  console.log("Press Ctrl+C to stop the database.");
}

function shutdown() {
  pg.stop()
    .catch(() => {})
    .finally(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((error) => {
  console.error("Failed to start embedded PostgreSQL:");
  console.error(error);
  process.exit(1);
});
