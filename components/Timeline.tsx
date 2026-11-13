"use client";

import { useState } from "react";
import { CalendarClock, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { GlossaryTerm, Obligation, Risk } from "@/lib/types";
import ObligationCard from "./ObligationCard";
import ReminderForm from "./ReminderForm";
import { riskDot } from "./RiskBadge";

const rank: Record<Risk, number> = { high: 0, medium: 1, low: 2 };
const MONTHS = ["sausis", "vasaris", "kovas", "balandis", "gegužė", "birželis", "liepa", "rugpjūtis", "rugsėjis", "spalis", "lapkritis", "gruodis"];

const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

// shortcut: prefix match instead of real Lithuanian morphology ("mokejimai" -> "mokejim"), upgrade if false hits pile up
function matches(o: Obligation, query: string) {
  const text = norm([o.title, o.plainExplanation, o.consequence, o.source.document, o.source.clause, ...o.evidence].join(" "));
  return norm(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => text.includes(w.length > 5 ? w.slice(0, -2) : w));
}

export default function Timeline({
  obligations,
  programId,
  programName,
  glossary,
  docUrl,
}: {
  obligations: Obligation[];
  programId: string;
  programName: string;
  glossary?: GlossaryTerm[];
  docUrl: string;
}) {
  const [query, setQuery] = useState("");
  const shown = obligations
    .filter((o) => matches(o, query))
    .sort((a, b) => rank[a.risk] - rank[b.risk] || a.dueDate.localeCompare(b.dueDate));

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = shown
    .flatMap((o) => o.dates.filter((d) => d >= today).map((date) => ({ date, o })))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 12);

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Ieškoti įsipareigojimų"
            placeholder="Ieškoti, pvz. mokėjimai"
            className="h-11 pl-9"
          />
        </div>
        {shown.length === 0 && (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Nieko nerasta pagal „{query}“.</p>
        )}
        <ol className="flex flex-col gap-4">
          {shown.map((o) => (
            <li key={o.id} id={o.id}>
              <ObligationCard obligation={o} programId={programId} programName={programName} glossary={glossary} docUrl={docUrl} />
            </li>
          ))}
        </ol>
      </div>

      {/* max-h + overflow: a sticky sidebar taller than the window could never be scrolled to its bottom */}
      <aside className="order-first flex flex-col gap-4 lg:sticky lg:top-20 lg:order-none lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" aria-hidden />
              <h2>Artėjantys terminai</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Artėjančių terminų nėra.</p>
            ) : (
              <ul className="flex flex-col text-sm">
                {upcoming.map(({ date, o }, i) => {
                  const month = date.slice(0, 7);
                  const newMonth = i === 0 || upcoming[i - 1].date.slice(0, 7) !== month;
                  return (
                    <li key={`${o.id}-${date}`}>
                      {newMonth && (
                        <p className={`mb-1 text-xs font-medium text-muted-foreground ${i > 0 ? "mt-3" : ""}`}>
                          {date.slice(0, 4)} m. {MONTHS[Number(date.slice(5, 7)) - 1]}
                        </p>
                      )}
                      <a href={`#${o.id}`} className="-mx-2 flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted">
                        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${riskDot[o.risk]}`} aria-hidden />
                        <span>
                          <span className="font-medium tabular-nums">{date.slice(8)} d.</span> {o.title}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        <ReminderForm obligations={obligations} programName={programName} />
      </aside>
    </div>
  );
}
