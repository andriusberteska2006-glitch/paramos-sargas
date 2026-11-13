"use client";

import { useState } from "react";
import type { GlossaryTerm, Obligation, Risk } from "@/lib/types";
import ObligationCard from "./ObligationCard";
import ReminderForm from "./ReminderForm";

const rank: Record<Risk, number> = { high: 0, medium: 1, low: 2 };
const dot: Record<Risk, string> = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-green-500" };
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
    <div className="flex flex-col gap-6 md:grid md:grid-cols-[1fr_18rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Ieškoti įsipareigojimų"
          placeholder="Ieškoti, pvz. mokėjimai"
          className="rounded border border-gray-300 p-2"
        />
        {shown.length === 0 && <p>Nieko nerasta pagal „{query}“.</p>}
        <ol className="flex flex-col gap-4">
          {shown.map((o) => (
            <li key={o.id} id={o.id} className="scroll-mt-4">
              <ObligationCard obligation={o} programId={programId} programName={programName} glossary={glossary} docUrl={docUrl} />
            </li>
          ))}
        </ol>
      </div>

      {/* max-h + overflow: a sticky sidebar taller than the window could never be scrolled to its bottom */}
      <aside className="order-first self-start rounded border border-gray-300 p-4 md:order-none md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto">
        <h2 className="mb-2 font-semibold">Artėjantys terminai</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm">Artėjančių terminų nėra.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {upcoming.map(({ date, o }, i) => {
              const month = date.slice(0, 7);
              const newMonth = i === 0 || upcoming[i - 1].date.slice(0, 7) !== month;
              return (
                <li key={`${o.id}-${date}`}>
                  {newMonth && (
                    <p className="mt-2 font-medium">
                      {date.slice(0, 4)} m. {MONTHS[Number(date.slice(5, 7)) - 1]}
                    </p>
                  )}
                  <a href={`#${o.id}`} className="flex items-start gap-2 hover:underline">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[o.risk]}`} aria-hidden />
                    <span>
                      <span className="font-medium">{date.slice(8)} d.</span> {o.title}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        <ReminderForm obligations={obligations} programName={programName} />
      </aside>
    </div>
  );
}
