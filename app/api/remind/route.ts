import { DAY, DAYS_BEFORE, KEY, dayOf, emailButton, emailDeadlines, esc, redis, reminderEntries, sendEmail, unsubscribeUrl } from "@/lib/reminders";

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const text = (s: unknown, max: number) => (typeof s === "string" && s.trim() && s.length <= max ? s.trim() : "");

// POST {email, programName, deadlines: [{title, date}]} → {ok}. Sends a confirmation now, stores future reminders.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const programName = text(body?.programName, 200);
  const raw: unknown[] = Array.isArray(body?.deadlines) && body.deadlines.length <= 300 ? body.deadlines : [];
  const deadlines = raw.map((x) => {
    const o = x as { title?: unknown; date?: unknown } | null;
    return { title: text(o?.title, 200), date: isDate(o?.date) ? o.date : "" };
  });
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 200 ||
    !programName ||
    !deadlines.length ||
    deadlines.some((d) => !d.title || !d.date)
  ) {
    return Response.json({ error: "Neteisingas el. paštas arba terminų sąrašas." }, { status: 400 });
  }

  const today = Math.floor(Date.now() / DAY);
  const entries = reminderEntries(email, programName, deadlines, today);
  const upcoming = deadlines.filter((d) => dayOf(d.date) >= today).sort((a, b) => a.date.localeCompare(b.date));
  if (!upcoming.length) return Response.json({ error: "Artėjančių terminų nėra." }, { status: 400 });

  try {
    // Per-IP daily cap, so nobody can use this endpoint to flood other people's inboxes.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "nezinomas";
    const limitKey = `${KEY}:limitas:${ip}:${today}`;
    if ((await redis<number>("INCR", limitKey)) > 5) {
      return Response.json({ error: "Per daug užsakymų iš šio įrenginio. Bandykite rytoj." }, { status: 429 });
    }
    await redis("EXPIRE", limitKey, 86400);

    const origin = new URL(request.url).origin;
    await sendEmail(
      email,
      `Priminimai užsakyti: ${programName}`,
      `<h1 style="margin:0 0 8px;font-size:20px;line-height:1.3">Priminimai užsakyti</h1>
       <p style="margin:0">Priminsime apie <b>${esc(programName)}</b> terminus likus ${DAYS_BEFORE.join(" ir ")} dienoms iki kiekvieno.</p>
       ${emailDeadlines(upcoming)}
       ${emailButton(`${origin}/rezultatai?saltinis=dokumentas`, "Atidaryti Paramos sargą")}`,
      unsubscribeUrl(origin, email),
    );
    // Store only after the confirmation went out, so an unreachable address gets no silent reminders.
    if (entries.length) await redis("ZADD", KEY, ...entries.flat());
  } catch (e) {
    console.error("remind:", e);
    return Response.json({ error: "Nepavyko užsakyti priminimų. Bandykite vėliau." }, { status: 502 });
  }
  return Response.json({ ok: true, reminders: entries.length });
}
