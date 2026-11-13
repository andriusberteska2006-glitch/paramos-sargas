import type { GlossaryTerm, Obligation, Risk } from "@/lib/types";
import ObligationCard from "./ObligationCard";

const rank: Record<Risk, number> = { high: 0, medium: 1, low: 2 };

/** The obligations as collapsed rows, most dangerous first. */
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
  const shown = [...obligations].sort((a, b) => rank[a.risk] - rank[b.risk] || a.dueDate.localeCompare(b.dueDate));

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Ką turite padaryti</h2>
      <p className="text-muted-foreground">Svarbiausi viršuje. Paspauskite, kad pamatytumėte daugiau.</p>
      <ol className="flex flex-col gap-3">
        {shown.map((o) => (
          <li key={o.id} id={o.id}>
            <ObligationCard obligation={o} programId={programId} programName={programName} glossary={glossary} docUrl={docUrl} />
          </li>
        ))}
      </ol>
    </section>
  );
}
