// Email reminders (server only). Due reminders sit in one Upstash Redis sorted set scored by the UTC day
// they must be sent; a daily Vercel Cron (/api/cron/priminimai) sends them with Resend.
import { createHmac, timingSafeEqual } from "node:crypto";

export const KEY = "priminimai";
export const DAY = 86_400_000;
export const DAYS_BEFORE = [30, 7];

/** One reminder = one set member. Deterministic JSON, so subscribing twice adds no duplicates. */
export type Reminder = { e: string; p: string; t: string; d: string; n: number };

export const dayOf = (isoDate: string) => Date.parse(isoDate) / DAY; // YYYY-MM-DD parses as UTC midnight

/** [send day, member] pairs for every reminder whose send day is today or later. */
export function reminderEntries(
  email: string,
  programName: string,
  deadlines: { title: string; date: string }[],
  today: number,
): [number, string][] {
  return deadlines
    .flatMap(({ title, date }) =>
      DAYS_BEFORE.map((n): [number, string] => [
        dayOf(date) - n,
        JSON.stringify({ e: email, p: programName, t: title, d: date, n } satisfies Reminder),
      ]),
    )
    .filter(([day]) => day >= today);
}

export async function redis<T = unknown>(...cmd: (string | number)[]): Promise<T> {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("KV_REST_API_URL / KV_REST_API_TOKEN not set");
  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(cmd) });
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok || json.error) throw new Error(`Redis ${cmd[0]}: ${json.error ?? res.status}`);
  return json.result as T;
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function secret() {
  if (!process.env.CRON_SECRET) throw new Error("CRON_SECRET not set");
  return process.env.CRON_SECRET;
}

const tokenFor = (email: string) => createHmac("sha256", secret()).update(`atsisakyti:${email}`).digest("base64url");

export function validToken(email: string, token: string) {
  const a = Buffer.from(tokenFor(email));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const unsubscribeUrl = (origin: string, email: string) =>
  `${origin}/api/remind/atsisakyti?email=${encodeURIComponent(email)}&token=${tokenFor(email)}`;

export async function sendEmail(to: string, subject: string, html: string, unsubscribe: string) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.REMIND_FROM || "Paramos sargas <onboarding@resend.dev>",
      to: [to],
      subject,
      html: `<div style="font-family:sans-serif;line-height:1.5">${html}<p style="color:#666;font-size:12px">Nebenorite priminimų? <a href="${esc(unsubscribe)}">Atsisakyti</a></p></div>`,
      // Gmail shows its own "Unsubscribe" button and POSTs to this URL (RFC 8058).
      headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
