import { DAY, KEY, dayOf, emailButton, emailDeadlines, redis, sendEmail, unsubscribeUrl, type Reminder } from "@/lib/reminders";

// Daily Vercel Cron (vercel.json). Sends every reminder due today or earlier, one email per address.
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const today = Math.floor(Date.now() / DAY);
  const due = await redis<string[]>("ZRANGE", KEY, "-inf", today, "BYSCORE");

  const byEmail = new Map<string, { member: string; r: Reminder }[]>();
  for (const member of due) {
    const r = JSON.parse(member) as Reminder;
    byEmail.set(r.e, [...(byEmail.get(r.e) ?? []), { member, r }]);
  }

  const origin = new URL(request.url).origin;
  let sent = 0;
  let failed = 0;
  for (const [email, rows] of byEmail) {
    // Skip deadlines that already passed (e.g. the cron was down for a while).
    const items = rows.map((x) => x.r).filter((r) => dayOf(r.d) >= today).sort((a, b) => a.d.localeCompare(b.d));
    try {
      if (items.length) {
        const left = (r: Reminder) => dayOf(r.d) - today;
        await sendEmail(
          email,
          items.length === 1 ? `Liko ${left(items[0])} d.: ${items[0].t}` : `Artėjantys paramos terminai (${items.length})`,
          `<h1 style="margin:0 0 8px;font-size:20px;line-height:1.3">Artėja paramos terminai</h1>
           <p style="margin:0">Laikas pasiruošti šiems įsipareigojimams:</p>
           ${emailDeadlines(items.map((r) => ({ date: r.d, title: r.t, note: `Liko ${left(r)} d. · ${r.p}` })))}
           ${emailButton(`${origin}/rezultatai?saltinis=dokumentas`, "Atidaryti Paramos sargą")}`,
          unsubscribeUrl(origin, email),
        );
        sent++;
      }
      await redis("ZREM", KEY, ...rows.map((x) => x.member));
    } catch (e) {
      console.error("cron priminimai:", email, e); // left in the set, retried tomorrow
      failed++;
    }
    // shortcut: Resend's free plan allows ~2 requests/s; switch to the batch endpoint when recipients grow
    await new Promise((r) => setTimeout(r, 600));
  }
  return Response.json({ sent, failed });
}
