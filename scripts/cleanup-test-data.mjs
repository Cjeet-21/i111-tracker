// One-off: remove leftover smoke-test users from the database and report counts.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const removed = await prisma.user.deleteMany({
  where: { email: { contains: "@example.com" } },
});

const users = await prisma.user.count();
const problems = await prisma.problem.count();
const revisions = await prisma.revisionHistory.count();
const sessions = await prisma.session.count();

await prisma.$disconnect();

console.log(`removed leftover test users : ${removed.count}`);
console.log(`users      : ${users}`);
console.log(`problems   : ${problems}`);
console.log(`revisions  : ${revisions}`);
console.log(`sessions   : ${sessions}`);
