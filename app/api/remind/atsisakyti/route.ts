import { KEY, esc, redis, validToken, type Reminder } from "@/lib/reminders";

function emailFrom(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") ?? "";
  return validToken(email, url.searchParams.get("token") ?? "") ? email : null;
}

const page = (body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Priminimai</title></head>
<body style="font-family:sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem;line-height:1.5">${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

// GET only shows a button: mail scanners open links, and that must not cancel anyone's reminders.
export async function GET(request: Request) {
  const email = emailFrom(request);
  if (!email) return page("<p>Netinkama nuoroda.</p>", 400);
  return page(`<h1>Atsisakyti priminimų?</h1>
<p>Daugiau nebesiųsime paramos terminų priminimų į <b>${esc(email)}</b>.</p>
<form method="post"><button style="padding:.5rem 1rem;font-size:1rem">Atsisakyti</button></form>`);
}

// Also the target of Gmail's one-click unsubscribe (List-Unsubscribe-Post).
export async function POST(request: Request) {
  const email = emailFrom(request);
  if (!email) return page("<p>Netinkama nuoroda.</p>", 400);
  // shortcut: scans the whole set; index members by email if subscribers grow into the thousands
  const all = await redis<string[]>("ZRANGE", KEY, 0, -1);
  const mine = all.filter((m) => (JSON.parse(m) as Reminder).e === email);
  if (mine.length) await redis("ZREM", KEY, ...mine);
  return page(`<p>Priminimų atsisakyta. Daugiau laiškų į <b>${esc(email)}</b> nesiųsime.</p>`);
}
