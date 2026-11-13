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

// Email HTML: tables + inline styles, because mail clients ignore stylesheets. Colors match app/globals.css.
const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const LINE = "border-top:1px solid #e1e8e4";

export const emailButton = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#1e6d59;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${esc(label)}</a>`;

/** Deadline rows: date, title, and an optional grey note under the title. */
export const emailDeadlines = (rows: { date: string; title: string; note?: string }[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0 24px">${rows
    .map(
      (r) =>
        `<tr><td style="${LINE};padding:10px 16px 10px 0;white-space:nowrap;vertical-align:top;font-weight:600">${esc(r.date)}</td>` +
        `<td style="${LINE};padding:10px 0">${esc(r.title)}${r.note ? `<div style="color:#5f746d;font-size:13px">${esc(r.note)}</div>` : ""}</td></tr>`,
    )
    .join("")}</table>`;

const emailLayout = (body: string, unsubscribe: string) => `<!doctype html><html lang="lt"><body style="margin:0;padding:0;background:#f1f5f3">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f3;padding:24px 12px;font-family:${FONT}"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e1e8e4;border-radius:14px;color:#17302a;font-size:15px;line-height:1.55;text-align:left">
<tr><td style="background:#1e6d59;color:#ffffff;padding:16px 24px;border-radius:13px 13px 0 0;font-size:16px;font-weight:600">&#10003;&nbsp; Paramos sargas</td></tr>
<tr><td style="padding:24px">${body}</td></tr>
</table>
<p style="max-width:600px;margin:16px auto 0;color:#5f746d;font-size:12px;line-height:1.5">Gavote šį laišką, nes užsisakėte paramos terminų priminimus. <a href="${esc(unsubscribe)}" style="color:#5f746d">Atsisakyti priminimų</a></p>
</td></tr></table></body></html>`;

export async function sendEmail(to: string, subject: string, html: string, unsubscribe: string) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.REMIND_FROM || "Paramos sargas <onboarding@resend.dev>",
      to: [to],
      subject,
      html: emailLayout(html, unsubscribe),
      // Gmail shows its own "Unsubscribe" button and POSTs to this URL (RFC 8058).
      headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
