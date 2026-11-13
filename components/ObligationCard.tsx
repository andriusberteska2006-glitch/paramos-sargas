"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, ChevronDown, FileText, TriangleExclamationPoint } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { GlossaryTerm, Obligation, Risk } from "@/lib/types";
import EvidenceChecklist from "./EvidenceChecklist";
import RiskBadge, { riskLabel } from "./RiskBadge";

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
  const ref = useRef<HTMLDivElement>(null);
  const [fromTag, setFromTag] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    // Source links in the "Ar galiu…?" answer jump here (#isipareigojimas-<id>); open the card so the jump shows something.
    const onHash = () => location.hash === `#isipareigojimas-${o.id}` && setExpanded(true);
    onHash();
    window.addEventListener("hashchange", onHash);
    if (new URLSearchParams(location.search).get("zyma") === o.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL after mount
      setFromTag(true);
      setExpanded(true);
      ref.current?.scrollIntoView();
    }
    return () => window.removeEventListener("hashchange", onHash);
  }, [o.id]);

  const text = [o.title, o.plainExplanation, o.consequence, ...o.evidence].join(" ");
  const terms = (glossary ?? []).filter((g) => mentions(text, g.forms));
  const docLink = (page: number, label: string) =>
    docUrl ? (
      <a href={`${docUrl}#page=${page}`} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80">
        {label} ({page} psl.)
      </a>
    ) : (
      `${label}: ${page} psl.`
    );

  return (
    <Card id={`isipareigojimas-${o.id}`} ref={ref} className="gap-0 py-0 target:ring-2 target:ring-ring">
      {fromTag && (
        <Alert variant="destructive" className="rounded-none border-0 bg-destructive/15 px-4 py-3 sm:px-5 *:data-[slot=alert-description]:text-foreground/90">
          <TriangleExclamationPoint aria-hidden />
          <AlertTitle className="text-base font-semibold">Pirkta už ES paramą</AlertTitle>
          <AlertDescription className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{o.title}: iki {o.dueDate}</span>
            <span>{o.plainExplanation}</span>
            <span><strong>Pasekmė:</strong> {o.consequence}</span>
            <a href="#ask-question" className="font-semibold text-destructive">
              Prieš parduodant, perkeliant ar išmetant paklauskite „Ar galiu…?“
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Collapsed row: only what, when and how risky. Everything else opens on tap. */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/30 sm:p-5"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex flex-wrap items-start justify-between gap-2">
            <span className="text-lg leading-snug font-semibold">{o.title}</span>
            <RiskBadge risk={o.risk} />
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <CalendarClock className="size-4 text-primary" aria-hidden />
            <span className="font-medium tabular-nums">Terminas: {o.dueDate}</span>
            {o.dates.length > 1 && <span className="text-muted-foreground">(kartojasi kasmet)</span>}
          </span>
        </span>
        <ChevronDown className={`mt-1 size-5 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {expanded && (
      <>
      <Separator />
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        {o.dates.length > 1 && <p className="text-sm text-muted-foreground">Visi terminai: {o.dates.join(", ")}</p>}
        <p className="leading-relaxed">{o.plainExplanation}</p>
        <div className="flex gap-2.5 rounded-lg bg-muted px-3 py-2.5 text-sm">
          <TriangleExclamationPoint className="mt-0.5 size-4 shrink-0 text-risk-medium" aria-hidden />
          <p><span className="font-medium">Pasekmė:</span> {o.consequence}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="size-3.5 shrink-0" aria-hidden />
            {o.source.document}, {o.source.page} psl., {o.source.clause}
          </p>
          <Button type="button" variant="link" className="h-10 px-0" onClick={() => setOpen(true)}>
            Paaiškinti paprastai
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-8 text-lg leading-snug">{o.title}</DialogTitle>
            <DialogDescription>Paaiškinimas paprastai kalba</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm leading-relaxed">
            <p><strong>Ką reikia daryti:</strong> {o.plainExplanation}</p>
            <p><strong>Iki kada:</strong> {o.dueDate}{o.dates.length > 1 && `, po to kasmet (${o.dates.slice(1).join(", ")})`}</p>
            <p><strong>{riskLabel[o.risk]}:</strong> {riskMeaning[o.risk]}</p>
            <p><strong>Kas bus, jei nepadarysite:</strong> {o.consequence}</p>
            {terms.length > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <h3 className="font-semibold">Sunkūs žodžiai paprastai</h3>
                <dl className="mt-2 flex flex-col gap-2">
                  {terms.map((g) => (
                    <div key={g.term}>
                      <dt className="font-medium">{g.term}</dt>
                      <dd>
                        {g.explanation} <span className="text-xs">{docLink(g.page, "Daugiau dokumente")}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {docLink(o.source.page, `Skaityti dokumente: ${o.source.document}, ${o.source.clause}`)}
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Supratau</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Separator />
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <h3 className="text-sm font-semibold">Įrodymai</h3>
        <EvidenceChecklist
          programId={programId}
          programName={programName}
          obligationId={o.id}
          obligationTitle={o.title}
          items={o.evidence}
        />
      </div>
      </>
      )}
    </Card>
  );
}
