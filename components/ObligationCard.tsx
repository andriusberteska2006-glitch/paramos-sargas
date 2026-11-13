import { useEffect, useRef, useState } from "react";
import type { GlossaryTerm, Obligation, Risk } from "@/lib/types";
import EvidenceChecklist from "./EvidenceChecklist";

const riskStyle: Record<Risk, string> = {
  high: "border-red-500 bg-red-50",
  medium: "border-amber-500 bg-amber-50",
  low: "border-green-500 bg-green-50",
};
const riskLabel: Record<Risk, string> = { high: "Didelė rizika", medium: "Vidutinė rizika", low: "Maža rizika" };
const riskMeaning: Record<Risk, string> = {
  high: "nepadarius gali tekti grąžinti visą paramą ar jos dalį.",
  medium: "nepadarius gali būti skirta bauda arba sustabdytas paramos mokėjimas.",
  low: "pasekmės mažesnės, bet vis tiek verta padaryti laiku.",
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Stems match any word ending: "perkanči organizacij" also hits "perkančiosios organizacijos".
const mentions = (text: string, forms: string[]) =>
  forms.some((f) => new RegExp(`(?<!\\p{L})${f.split(/\s+/).map(escape).join("\\p{L}*\\s+")}`, "iu").test(text));

export default function ObligationCard({
  obligation: o,
  programId,
  programName,
  glossary,
  docUrl,
}: {
  obligation: Obligation;
  programId: string;
  programName: string;
  glossary?: GlossaryTerm[];
  docUrl: string;
}) {
  // An NFC/QR tag on the equipment opens /rezultatai?...&zyma=<obligation id>.
  // Read after mount (not useSearchParams) so it also works when cards render late from localStorage.
  const ref = useRef<HTMLElement>(null);
  const [fromTag, setFromTag] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(location.search).get("zyma") !== o.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL after mount
    setFromTag(true);
    ref.current?.scrollIntoView();
  }, [o.id]);

  const popId = `paaiskinimas-${o.id}`;
  const open = () => {
    const p = document.getElementById(popId);
    if (p && !p.matches(":popover-open")) p.showPopover();
  };
  const text = [o.title, o.plainExplanation, o.consequence, ...o.evidence].join(" ");
  const terms = (glossary ?? []).filter((g) => mentions(text, g.forms));
  const docLink = (page: number, label: string) =>
    docUrl ? (
      <a href={`${docUrl}#page=${page}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
        {label} ({page} psl.)
      </a>
    ) : (
      `${label}: ${page} psl.`
    );

  return (
    <article
      id={`isipareigojimas-${o.id}`}
      ref={ref}
      className={`flex scroll-mt-4 flex-col gap-2 rounded border-l-4 p-4 text-gray-900 target:ring-4 target:ring-blue-600 ${riskStyle[o.risk]}`}
    >
      {fromTag && (
        <div role="alert" className="flex flex-col gap-1 rounded bg-red-700 p-3 text-white">
          <p className="text-lg font-bold">Pirkta už ES paramą</p>
          <p className="font-semibold">{o.title}: iki {o.dueDate}</p>
          <p>{o.plainExplanation}</p>
          <p><strong>Pasekmė:</strong> {o.consequence}</p>
          <a href="#ask-question" className="self-start font-semibold underline">
            Prieš parduodant, perkeliant ar išmetant paklauskite „Ar galiu…?“
          </a>
        </div>
      )}
      {/* The whole top of the card opens the plain-language window; the checklist below stays separately clickable. */}
      <div onClick={open} className="flex cursor-pointer flex-col gap-2">
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
        <button type="button" className="self-start text-sm text-blue-700 underline">
          Paaiškinti paprastai
        </button>
      </div>

      {/* Native popover: closes on Esc / click outside. m-auto restores the centering Tailwind's reset removes; no display class on it or it would always show. */}
      <div id={popId} popover="auto" className="m-auto max-h-[85vh] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto rounded border border-gray-300 bg-white p-5 text-gray-900 shadow-lg backdrop:bg-black/40">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{o.title}</h2>
          <p><strong>Ką reikia daryti:</strong> {o.plainExplanation}</p>
          <p><strong>Iki kada:</strong> {o.dueDate}{o.dates.length > 1 && `, po to kasmet (${o.dates.slice(1).join(", ")})`}</p>
          <p><strong>{riskLabel[o.risk]}:</strong> {riskMeaning[o.risk]}</p>
          <p><strong>Kas bus, jei nepadarysite:</strong> {o.consequence}</p>
          {terms.length > 0 && (
            <>
              <h3 className="font-semibold">Sunkūs žodžiai paprastai</h3>
              <dl className="flex flex-col gap-2">
                {terms.map((g) => (
                  <div key={g.term}>
                    <dt className="font-medium">{g.term}</dt>
                    <dd>
                      {g.explanation} <span className="text-sm">{docLink(g.page, "Daugiau dokumente")}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          <p className="text-sm">
            {docLink(o.source.page, `Skaityti dokumente: ${o.source.document}, ${o.source.clause}`)}
          </p>
          <button type="button" popoverTarget={popId} popoverTargetAction="hide" className="self-end rounded bg-blue-700 px-4 py-2 text-white">
            Supratau
          </button>
        </div>
      </div>

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
