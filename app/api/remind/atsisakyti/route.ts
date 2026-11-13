import { KEY, esc, redis, validToken, type Reminder } from "@/lib/reminders";

function emailFrom(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") ?? "";
  return validToken(email, url.searchParams.get("token") ?? "") ? email : null;
}

// Standalone HTML (not a Next page, so it works as Gmail's one-click POST target). Colors match app/globals.css.
const STYLE = `*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:#f8faf9;color:#17302a;font:16px/1.55 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
main{width:100%;max-width:28rem}
.brand{display:flex;align-items:center;gap:8px;margin-bottom:16px;color:#17302a;font-weight:600;text-decoration:none}
.logo{display:grid;place-items:center;width:32px;height:32px;border-radius:8px;background:#1e6d59;color:#fff}
.card{background:#fff;border:1px solid #e1e8e4;border-radius:14px;padding:24px}
h1{margin:0 0 8px;font-size:20px;line-height:1.3}
p{margin:0;color:#5f746d}
b{color:#17302a}
button{margin-top:20px;height:44px;padding:0 20px;border:0;border-radius:10px;background:#1e6d59;color:#fff;font:inherit;font-weight:600;cursor:pointer}
button:hover{background:#185a49}
button:focus-visible{outline:3px solid rgba(30,109,89,.4);outline-offset:2px}
.ok{display:grid;place-items:center;width:40px;height:40px;margin-bottom:12px;border-radius:999px;background:#e6f3ed;color:#1e6d59;font-weight:700}`;

const page = (body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Priminimai · Paramos sargas</title><style>${STYLE}</style></head>
<body><main><a class="brand" href="/"><span class="logo">&#10003;</span>Paramos sargas</a><div class="card">${body}</div></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

const invalid = () =>
  page("<h1>Netinkama nuoroda</h1><p>Nuoroda pasenusi arba nukopijuota ne visa. Atidarykite ją iš paskutinio gauto laiško.</p>", 400);

// GET only shows a button: mail scanners open links, and that must not cancel anyone's reminders.
export async function GET(request: Request) {
  const email = emailFrom(request);
  if (!email) return invalid();
  return page(`<h1>Atsisakyti priminimų?</h1>
<p>Daugiau nebesiųsime paramos terminų priminimų į <b>${esc(email)}</b>.</p>
<form method="post"><button>Atsisakyti priminimų</button></form>`);
}

// Also the target of Gmail's one-click unsubscribe (List-Unsubscribe-Post).
export async function POST(request: Request) {
  const email = emailFrom(request);
  if (!email) return invalid();
  // shortcut: scans the whole set; index members by email if subscribers grow into the thousands
  const all = await redis<string[]>("ZRANGE", KEY, 0, -1);
  const mine = all.filter((m) => (JSON.parse(m) as Reminder).e === email);
  if (mine.length) await redis("ZREM", KEY, ...mine);
  return page(`<div class="ok">&#10003;</div><h1>Priminimų atsisakyta</h1>
<p>Daugiau laiškų į <b>${esc(email)}</b> nesiųsime.</p>`);
}
