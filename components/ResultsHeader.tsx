import type { Obligation, Program, UserInputs } from "@/lib/types";
import { riskDot, riskLabel } from "./RiskBadge";

const DAY = 86_400_000;
const time = (d: string) => Date.parse(d);

/** Program name, the money at stake, the next deadline and every date on one band (both the document and the query flow). */
export default function ResultsHeader({ program, inputs, obligations }: { program: Program; inputs: UserInputs; obligations: Obligation[] }) {
  const now = Date.now();
  const points = obligations.flatMap((o) => o.dates.map((date) => ({ o, date }))).sort((a, b) => a.date.localeCompare(b.date));
  const next = points.find((p) => time(p.date) >= now - DAY);
  const daysLeft = next ? Math.max(0, Math.ceil((time(next.date) - now) / DAY)) : 0;
  const high = obligations.filter((o) => o.risk === "high").length;

  const start = time(inputs.contractSignedDate);
  const end = Math.max(time(points.at(-1)?.date ?? inputs.projectEndDate), time(inputs.projectEndDate), start + DAY);
  const pos = (t: number) => `${Math.min(100, Math.max(0, ((t - start) / (end - start)) * 100))}%`;
  const firstYear = new Date(start).getFullYear() + 1;
  const years = Array.from({ length: Math.max(0, new Date(end).getFullYear() - firstYear + 1) }, (_, i) => firstYear + i);

  const stats = [
    ["Parama", `${inputs.grantAmount.toLocaleString("lt-LT")} EUR`],
    ["Sutartis pasirašyta", inputs.contractSignedDate],
    ["Projekto pabaiga", inputs.projectEndDate],
  ];

  return (
    <header className="flex flex-col gap-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Jūsų įsipareigojimai</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">{program.name}</h1>
        {program.agency && <p className="mt-1 text-muted-foreground">{program.agency}</p>}
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border md:grid-cols-2">
        <div className="bg-card p-5 sm:p-6">
          <p className="text-sm text-muted-foreground">{high > 0 ? "Rizikuojate prarasti iki" : "Gauta parama"}</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
            {inputs.grantAmount.toLocaleString("lt-LT")} EUR
          </p>
          <p className="mt-2 text-muted-foreground">
            {obligations.length} įsipareigojimų
            {high > 0 && <>, iš jų <span className="font-medium text-risk-high">{high} didelės rizikos</span></>}
          </p>
        </div>
        <div className="bg-card p-5 sm:p-6">
          <p className="text-sm text-muted-foreground">Kitas terminas</p>
          {next ? (
            <>
              <p className={`mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl ${daysLeft < 30 ? "text-risk-high" : ""}`}>
                {daysLeft === 0 ? "Šiandien" : `po ${daysLeft} d.`}
              </p>
              <a href={`#isipareigojimas-${next.o.id}`} className="mt-2 block text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                {next.o.title}, {next.date}
              </a>
            </>
          ) : (
            <p className="mt-1 text-2xl font-semibold">Visi terminai praėję</p>
          )}
        </div>
      </div>

      {/* Every deadline on one band from signing to the last date: the whole multi-year obligation at a glance. */}
      <figure className="flex flex-col gap-3">
        <figcaption className="text-sm text-muted-foreground">Visi terminai nuo sutarties pasirašymo</figcaption>
        <div className="relative h-16">
          <div className="absolute inset-x-0 top-6 h-px bg-border" />
          {years.map((y) => (
            <span key={y} className="absolute top-9 -translate-x-1/2 text-xs text-muted-foreground tabular-nums" style={{ left: pos(Date.UTC(y, 0, 1)) }}>
              {y}
            </span>
          ))}
          {now > start && now < end && (
            <span className="absolute top-0 h-12 w-px bg-foreground" style={{ left: pos(now) }}>
              <span className="absolute -top-0.5 left-1.5 text-xs font-medium whitespace-nowrap">Šiandien</span>
            </span>
          )}
          {points.map(({ o, date }) => (
            <a
              key={`${o.id}-${date}`}
              href={`#isipareigojimas-${o.id}`}
              title={`${date}: ${o.title} (${riskLabel[o.risk]})`}
              aria-label={`${date}: ${o.title}`}
              className={`absolute top-6 size-3 -translate-1/2 rounded-full ring-2 ring-background ${riskDot[o.risk]} ${time(date) < now ? "opacity-40" : ""}`}
              style={{ left: pos(time(date)) }}
            />
          ))}
        </div>
      </figure>

      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-card px-4 py-3">
            <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums sm:text-lg">{value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
