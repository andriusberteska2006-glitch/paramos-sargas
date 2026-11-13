import type { Obligation, Risk } from "@/lib/types";
import EvidenceChecklist from "./EvidenceChecklist";

const riskStyle: Record<Risk, string> = {
  high: "border-red-500 bg-red-50",
  medium: "border-amber-500 bg-amber-50",
  low: "border-green-500 bg-green-50",
};
const riskLabel: Record<Risk, string> = { high: "Didelė rizika", medium: "Vidutinė rizika", low: "Maža rizika" };

export default function ObligationCard({
  obligation: o,
  programId,
  programName,
}: {
  obligation: Obligation;
  programId: string;
  programName: string;
}) {
  return (
    <article
      id={`isipareigojimas-${o.id}`}
      className={`flex scroll-mt-4 flex-col gap-2 rounded border-l-4 p-4 text-gray-900 target:ring-4 target:ring-blue-600 ${riskStyle[o.risk]}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{o.title}</h2>
        <span className="text-sm font-medium">{riskLabel[o.risk]}</span>
      </div>
      <p className="font-medium">
        Terminas: {o.dueDate}
        {o.dates.length > 1 && ` (kartojasi kasmet: ${o.dates.join(", ")})`}
      </p>
      <p>{o.plainExplanation}</p>
      <p><strong>Pasekmė:</strong> {o.consequence}</p>
      <p className="text-sm text-gray-600">
        Šaltinis: {o.source.document}, {o.source.page} psl., {o.source.clause}
      </p>
      <h3 className="font-medium">Įrodymai</h3>
      <EvidenceChecklist
        programId={programId}
        programName={programName}
        obligationId={o.id}
        obligationTitle={o.title}
        items={o.evidence}
      />
    </article>
  );
}
