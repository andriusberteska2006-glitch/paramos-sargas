import type { Program, UserInputs } from "@/lib/types";

/** Program name and the key project facts above the timeline (both the document and the query flow). */
export default function ResultsHeader({ program, inputs, count }: { program: Program; inputs: UserInputs; count: number }) {
  const stats = [
    ["Parama", `${inputs.grantAmount.toLocaleString("lt-LT")} EUR`],
    ["Sutartis pasirašyta", inputs.contractSignedDate],
    ["Projekto pabaiga", inputs.projectEndDate],
    ["Įsipareigojimai", String(count)],
  ];
  return (
    <header className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Jūsų įsipareigojimai</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">{program.name}</h1>
        {program.agency && <p className="mt-1 text-muted-foreground">{program.agency}</p>}
      </div>
      {/* One spec-sheet block (1px gaps show the border colour) instead of four floating KPI tiles. */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-card px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
