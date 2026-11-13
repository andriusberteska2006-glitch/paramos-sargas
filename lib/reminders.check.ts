// Self-check for reminderEntries and unsubscribe tokens. Run: node lib/reminders.check.ts
import assert from "node:assert/strict";
import { dayOf, reminderEntries, unsubscribeUrl, validToken, type Reminder } from "./reminders.ts";

const today = dayOf("2026-11-12");
const run = (date: string) => reminderEntries("a@b.lt", "P", [{ title: "T", date }], today);
const sendDates = (date: string) => run(date).map(([day]) => new Date(day * 86_400_000).toISOString().slice(0, 10));

assert.deepEqual(sendDates("2026-12-31"), ["2026-12-01", "2026-12-24"]); // both in the future
assert.deepEqual(sendDates("2026-11-20"), ["2026-11-13"]); // 30-day reminder already past
assert.deepEqual(sendDates("2026-11-19"), ["2026-11-12"]); // 7 days before = today, still sent
assert.deepEqual(sendDates("2026-11-01"), []); // deadline already past
assert.deepEqual(run("2026-12-31"), run("2026-12-31")); // deterministic members, so ZADD dedupes re-subscribes
assert.deepEqual(JSON.parse(run("2026-12-31")[0][1]) as Reminder, { e: "a@b.lt", p: "P", t: "T", d: "2026-12-31", n: 30 });

process.env.CRON_SECRET = "test-secret";
const token = new URL(unsubscribeUrl("https://x.lt", "a@b.lt")).searchParams.get("token")!;
assert.ok(validToken("a@b.lt", token));
assert.ok(!validToken("kitas@b.lt", token));
assert.ok(!validToken("a@b.lt", token.slice(1)));

console.log("reminders.check: ok");
