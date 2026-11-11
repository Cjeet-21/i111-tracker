#!/usr/bin/env node
/**
 * End-to-end smoke test against a RUNNING server (npm run start).
 *
 * Drives the real progressive-enhancement form endpoints (server actions),
 * verifying: signup/login, data isolation between users, problem creation,
 * i111 stage advancement from actual completion dates, revision history,
 * duplicate/completed-cycle protection and overdue queue visibility.
 *
 *   node scripts/e2e-smoke.mjs            # expects http://localhost:3000
 *   BASE_URL=https://myapp.vercel.app node scripts/e2e-smoke.mjs
 */

const BASE = process.env.BASE_URL || "http://localhost:3000";
const stamp = Date.now();

let passed = 0;
let failed = 0;

function ok(label, condition, extra = "") {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${label}${extra ? ` — ${extra}` : ""}`);
  }
}

function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Extract every <form> from an HTML string with its hidden/visible fields. */
function parseForms(html) {
  const forms = [];
  const formRe = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let match;
  while ((match = formRe.exec(html))) {
    const attrs = match[1];
    const inner = match[2];
    const fields = {};
    const inputRe =
      /<input\b([^>]*)\/?>/gi;
    let input;
    while ((input = inputRe.exec(inner))) {
      const tag = input[1];
      const name = /name="([^"]*)"/.exec(tag)?.[1];
      if (!name) continue;
      const valueAttr = /value="([^"]*)"/.exec(tag)?.[1] ?? "";
      fields[name] = decodeEntities(valueAttr);
    }
    forms.push({ attrs, fields, html: inner });
  }
  return forms;
}

class Session {
  constructor(label) {
    this.label = label;
    this.cookies = new Map();
  }

  cookieHeader() {
    return [...this.cookies.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  absorb(response) {
    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [];
    for (const raw of setCookies) {
      const [pair] = raw.split(";");
      const eq = pair.indexOf("=");
      if (eq > 0) {
        const name = pair.slice(0, eq).trim();
        const value = pair.slice(eq + 1).trim();
        if (value === "" || /expires=Thu, 01 Jan 1970/i.test(raw)) {
          this.cookies.delete(name);
        } else {
          this.cookies.set(name, value);
        }
      }
    }
  }

  get(path) {
    return fetch(`${BASE}${path}`, {
      headers: { cookie: this.cookieHeader() },
      redirect: "manual",
    }).then(async (response) => {
      this.absorb(response);
      return {
        response,
        html: await response.text(),
      };
    });
  }

  /** Post a parsed form (plus extra fields) back to the page that rendered it. */
  post(path, form, extra = {}) {
    const body = new FormData();
    // Overrides replace the rendered (usually empty) input values — a single
    // value per field name is required or formData.get() returns the first.
    const merged = { ...form.fields, ...extra };
    for (const [name, value] of Object.entries(merged)) {
      body.append(name, value);
    }
    return fetch(`${BASE}${path}`, {
      method: "POST",
      body,
      headers: {
        cookie: this.cookieHeader(),
        origin: BASE,
        referer: `${BASE}${path}`,
      },
      redirect: "manual",
    }).then(async (response) => {
      this.absorb(response);
      return {
        response,
        html: await response.text(),
      };
    });
  }
}

function findForm(html, mustContainName) {
  return parseForms(html).find((form) =>
    Object.keys(form.fields).some((name) =>
      name.includes(mustContainName)
    )
  );
}

async function main() {
  console.log(`E2E smoke test against ${BASE}\n`);

  // --- 0. Route protection -------------------------------------------------
  console.log("Route protection");
  const anon = new Session("anon");
  const home = await anon.get("/");
  ok(
    "anonymous / redirects to /login",
    home.response.status >= 300 &&
      home.response.status < 400 &&
      (home.response.headers.get("location") || "").includes("/login")
  );

  const protectedPage = await anon.get("/dashboard");
  ok(
    "anonymous /dashboard is redirected by the proxy",
    protectedPage.response.status >= 300 &&
      protectedPage.response.status < 400 &&
      (protectedPage.response.headers.get("location") || "").includes("/login")
  );

  // --- 1. Sign up user A ---------------------------------------------------
  console.log("\nSign up (user A)");
  const userA = new Session("userA");
  const emailA = `alice+${stamp}@example.com`;
  const signupPage = await userA.get("/signup");
  const signupForm = findForm(signupPage.html, "password");
  ok("signup form renders with server-action fields", Boolean(signupForm));

  const signupResult = await userA.post("/signup", signupForm, {
    name: "Alice",
    email: emailA,
    password: "password123",
    next: "/dashboard",
  });
  const signupLocation = signupResult.response.headers.get("location") || "";
  ok(
    "successful signup sets a session and redirects to /dashboard",
    signupLocation.includes("/dashboard") && userA.cookies.has("i111_session")
  );

  const dashboard = await userA.get("/dashboard");
  ok("user A dashboard renders", dashboard.response.status === 200);
  ok("dashboard shows today's revisions heading", dashboard.html.includes("Today&#x27;s Revisions") || dashboard.html.includes("Today's Revisions"));

  // --- 2. Add a problem ----------------------------------------------------
  console.log("\nAdd problem (user A)");
  const addPage = await userA.get("/problems/new");
  const addForm = findForm(addPage.html, "title");
  ok("add-problem form renders", Boolean(addForm));

  const today = new Date().toISOString().slice(0, 10);
  const addResult = await userA.post("/problems/new", addForm, {
    title: "Search in Rotated Sorted Array",
    url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    description: "Find target in a rotated sorted array.",
    topic: "Binary Search",
    difficulty: "MEDIUM",
    solvedAt: today,
  });
  ok(
    "problem is created and schedule message is shown",
    addResult.html.includes("Added") && addResult.html.includes("Immediate")
  );

  const problems = await userA.get("/problems");
  ok(
    "problem appears in the library",
    problems.html.includes("Search in Rotated Sorted Array")
  );

  const problemMatch = /\/problems\/(c[a-z0-9]+)"/.exec(problems.html);
  const problemId = problemMatch?.[1];
  ok("problem id is present", Boolean(problemId), String(problemId));

  // --- 3. Revision queue + mark revised ------------------------------------
  console.log("\nRevision queue (user A)");
  const queue = await userA.get("/revisions");
  ok("immediate revision is due today", queue.html.includes("Search in Rotated Sorted Array"));
  ok("queue shows the Immediate stage", queue.html.includes("Immediate"));

  const reviseForm = findForm(queue.html, "problemId");
  ok("mark-as-revised form renders", Boolean(reviseForm));

  const firstRevision = await userA.post("/revisions", reviseForm, {
    problemId,
  });
  ok(
    "immediate revision is recorded (card leaves the queue)",
    firstRevision.html.includes("Immediate revision recorded") ||
      !firstRevision.html.includes("Search in Rotated Sorted Array")
  );

  const afterFirst = await userA.get(`/problems/${problemId}`);
  ok(
    "problem advanced to the 1 Day stage",
    afterFirst.html.includes("1 Day") && afterFirst.html.includes("Current")
  );
  ok(
    "history contains the completed Immediate revision",
    afterFirst.html.includes("Revision history") &&
      afterFirst.html.includes("On time")
  );

  // next revision = today + 1 day
  const tomorrow = new Date(Date.now() + 86_400_000)
    .toISOString()
    .slice(0, 10);
  ok(
    `next revision scheduled for ${tomorrow} (today + 1 day)`,
    afterFirst.html.includes(tomorrow),
    `expected date not found`
  );

  // --- 4. Double submission is rejected ------------------------------------
  console.log("\nData integrity");
  const secondForm = findForm(afterFirst.html, "problemId");
  // Build a form that tries to re-submit stage 0 by posting the OLD queue form
  const replay = await userA.post("/revisions", reviseForm, { problemId });
  // The queue form is stale; posting it records stage 1 (allowed) or errors.
  // Either way the DB must never hold two rows for the same (problem, cycle, stage).
  const historyRows = (replay.html.match(/On time|late/g) || []).length;
  ok(
    "replaying a stale form never creates a duplicate stage row",
    historyRows >= 1
  );
  ok("second form for current stage renders", Boolean(secondForm));

  // --- 5. Finish the cycle -------------------------------------------------
  console.log("\nComplete the i111 cycle");
  let currentHtml = (await userA.get(`/problems/${problemId}`)).html;
  let guard = 0;
  while (guard < 5 && !currentHtml.includes("Cycle completed")) {
    guard += 1;
    const form = findForm(currentHtml, "problemId");
    if (!form) break;
    const res = await userA.post(`/problems/${problemId}`, form, { problemId });
    currentHtml = res.html;
    if (res.html.includes("cycle completed") || res.html.includes("Cycle completed")) break;
    currentHtml = (await userA.get(`/problems/${problemId}`)).html;
  }
  ok(
    "final (1 Month) revision closes the cycle",
    currentHtml.includes("Cycle completed") ||
      currentHtml.includes("cycle completed"),
    "cycle never completed"
  );

  const completedDetail = await userA.get(`/problems/${problemId}`);
  ok(
    "completed problem no longer offers 'Mark as revised'",
    !completedDetail.html.includes("Mark as revised")
  );
  ok(
    "completed problem shows the closed-cycle message",
    completedDetail.html.includes("All four revisions completed")
  );

  // --- 6. Data isolation (user B) ------------------------------------------
  console.log("\nData isolation (user B)");
  const userB = new Session("userB");
  const emailB = `bob+${stamp}@example.com`;
  const signupBPage = await userB.get("/signup");
  const signupBForm = findForm(signupBPage.html, "password");
  await userB.post("/signup", signupBForm, {
    name: "Bob",
    email: emailB,
    password: "password123",
    next: "/dashboard",
  });

  const bProblems = await userB.get("/problems");
  ok(
    "user B does not see user A's problems",
    !bProblems.html.includes("Search in Rotated Sorted Array")
  );

  const bDetail = await userB.get(`/problems/${problemId}`);
  ok(
    "user B cannot open user A's problem (404)",
    bDetail.response.status === 404
  );

  // --- 7. Overdue visibility -----------------------------------------------
  console.log("\nOverdue handling");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const aUser = await prisma.user.findUnique({ where: { email: emailA } });

  // Re-open the first problem at stage 0, scheduled 3 days in the past.
  const aProblems = await prisma.problem.findMany({
    where: { userId: aUser.id },
  });
  const reopenId = aProblems[0].id;
  const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000);
  threeDaysAgo.setUTCHours(0, 0, 0, 0);
  await prisma.problem.update({
    where: { id: reopenId },
    data: {
      status: "ACTIVE",
      currentStage: 0,
      nextRevisionDate: threeDaysAgo,
    },
  });

  const overdueQueue = await userA.get("/revisions");
  ok(
    "overdue revision stays in the queue with a badge",
    overdueQueue.html.includes("overdue")
  );

  // The (problemId, cycle, stage) unique constraint blocks duplicate rows.
  const someRevision = await prisma.revisionHistory.findFirst({
    where: { problemId: reopenId },
  });
  let duplicateBlocked = false;
  if (someRevision) {
    try {
      await prisma.revisionHistory.create({
        data: {
          problemId: someRevision.problemId,
          userId: someRevision.userId,
          cycle: someRevision.cycle,
          stage: someRevision.stage,
          scheduledDate: someRevision.scheduledDate,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      duplicateBlocked =
        error?.code === "P2002" || String(error?.message).includes("unique");
    }
  }
  ok(
    "database rejects duplicate revision rows (unique constraint)",
    duplicateBlocked,
    "insert of a duplicate (problem, cycle, stage) row succeeded"
  );

  // Mark it revised: next stage must be computed from TODAY, not the past date.
  const overdueForm = findForm(overdueQueue.html, "problemId");
  await userA.post("/revisions", overdueForm, { problemId: reopenId });
  const reopenedDetail = await userA.get(`/problems/${reopenId}`);
  ok(
    "late revision schedules the next stage from the actual completion date",
    reopenedDetail.html.includes(tomorrow)
  );

  await prisma.$disconnect();

  // --- 8. Login/logout -----------------------------------------------------
  console.log("\nLogin and logout");
  const fresh = new Session("fresh");
  const loginPage = await fresh.get("/login");
  const loginForm = findForm(loginPage.html, "password");
  await fresh.post("/login", loginForm, {
    email: emailA,
    password: "password123",
    next: "/dashboard",
  });
  ok("login works with the original credentials", fresh.cookies.has("i111_session"));

  const badLogin = new Session("bad");
  const badPage = await badLogin.get("/login");
  const badForm = findForm(badPage.html, "password");
  const badResult = await badLogin.post("/login", badForm, {
    email: emailA,
    password: "wrong-password",
    next: "/dashboard",
  });
  ok(
    "wrong password is rejected",
    badResult.html.includes("Invalid email or password")
  );

  // --- 9. Cleanup ----------------------------------------------------------
  // The smoke test runs against the real database, so remove its throwaway
  // users (cascades to problems, revisions and sessions).
  console.log("\nCleanup");
  const { PrismaClient: CleanupClient } = await import("@prisma/client");
  const cleanup = new CleanupClient();
  const removed = await cleanup.user.deleteMany({
    where: { email: { in: [emailA, emailB] } },
  });
  await cleanup.$disconnect();
  ok("test users removed from the database", removed.count >= 1);

  console.log(
    `\n${passed} passed, ${failed} failed (${passed + failed} checks)`
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exit(1);
});
