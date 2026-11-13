"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, LoaderCircle, Pencil, Plus, Trash, TriangleExclamationPoint, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONDITION_LABELS, FLAGS, FLAG_LABELS } from "@/lib/flags";
import type { Flag, ObligationTemplate, Program, UserInputs } from "@/lib/types";
import sample from "@/data/pavyzdys.json";
import RiskBadge from "./RiskBadge";

export const STORAGE_KEY = "paramos-sargas:dokumentas";
/** rulesFrom = name of the /data program whose general rules were merged in; note = what kind of document it was and which values were inferred. */
export type DocumentData = { program: Program; inputs: UserInputs; rulesFrom?: string | null; note?: string | null };

/** The user's own goal: only "what" and "until when"; the rest gets defaults. */
const newGoal = (title: string, fixedDate: string): ObligationTemplate => ({
  id: `o${Date.now()}`,
  title,
  plainExplanation: "",
  fixedDate,
  startsFrom: "project_end",
  offsetMonths: 0,
  recurring: "none",
  recurringYears: 1,
  risk: "medium",
  consequence: "",
  source: { document: "Mano tikslas", page: 0, clause: "" },
  evidence: [],
});

function deadlineText(o: ObligationTemplate): string {
  const when = o.fixedDate
    ? `iki ${o.fixedDate}`
    : `${o.offsetMonths} mėn. po ${o.startsFrom === "contract_signed" ? "sutarties pasirašymo" : "projekto pabaigos"}`;
  return o.recurring === "yearly" ? `${when}, kasmet ${o.recurringYears ?? 5} k.` : when;
}

/** Manual entry: start the editor from a /data program's rules with empty project data. */
function manualStart(rules: Program): DocumentData {
  return {
    program: { ...rules, id: `rankinis-${Date.now()}` },
    inputs: {
      programId: "", contractSignedDate: "", projectEndDate: "", grantAmount: 0, promisedJobs: 0,
      ...(Object.fromEntries(FLAGS.map((k) => [k, k === "isSme"])) as Record<Flag, boolean>),
    },
    rulesFrom: rules.name,
  };
}

/** Label + control; the <label> wraps the control, so no ids are needed. */
function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`grid content-start gap-1.5 text-sm font-medium ${className}`}>
      {label}
      {children}
    </label>
  );
}

function Choice<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Record<T, string>;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(options) as T[]).map((k) => (
          <SelectItem key={k} value={k}>{options[k]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function DocumentUpload({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [data, setData] = useState<DocumentData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  // Closing the manual section hides its editor too (data is kept for when it is reopened).
  const showEditor = data && (!data.program.id.startsWith("rankinis-") || manualOpen);
  // Extraction leaves these empty when the document doesn't state them (e.g. an application, not a contract).
  const missing = data && !data.program.id.startsWith("rankinis-")
    ? [!data.inputs.contractSignedDate && "sutarties pasirašymo datos", !data.inputs.projectEndDate && "projekto pabaigos datos", !data.inputs.grantAmount && "paramos sumos"].filter(Boolean)
    : [];
  const [goal, setGoal] = useState({ title: "", date: "" });
  // Program rules from /data are our curated data: shown and removable, not edited.
  const ruleIds = new Set(programs.flatMap((p) => p.obligations.map((o) => o.id)));

  function addGoal() {
    if (!goal.title.trim() || !goal.date) return;
    setObligations((list) => [...list, newGoal(goal.title.trim(), goal.date)]);
    setGoal({ title: "", date: "" });
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/extract", { method: "POST", body: new FormData(e.currentTarget) });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error);
      setData(body);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Nepavyko nuskaityti dokumento. Bandykite dar kartą.");
    } finally {
      setLoading(false);
    }
  }

  const setInput = (patch: Partial<UserInputs>) => setData((d) => d && { ...d, inputs: { ...d.inputs, ...patch } });
  const setProgram = (patch: Partial<Program>) => setData((d) => d && { ...d, program: { ...d.program, ...patch } });
  const setObligations = (fn: (list: ObligationTemplate[]) => ObligationTemplate[]) =>
    setData((d) => d && { ...d, program: { ...d.program, obligations: fn(d.program.obligations) } });
  const setOb = (i: number, patch: Partial<ObligationTemplate>) =>
    setObligations((list) => list.map((o, j) => (j === i ? { ...o, ...patch } : o)));

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    const clean: DocumentData = {
      ...data,
      inputs: { ...data.inputs, programId: data.program.id },
      program: {
        ...data.program,
        obligations: data.program.obligations.map((o) => ({
          ...o,
          fixedDate: o.fixedDate || undefined,
          evidence: o.evidence.map((s) => s.trim()).filter(Boolean),
        })),
      },
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {
      setError("Nepavyko išsaugoti duomenų naršyklėje.");
      return;
    }
    router.push("/rezultatai?saltinis=dokumentas");
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onUpload} className="flex flex-col gap-4">
        {/* The real file input covers the whole zone (invisible), so click, drag & drop and `required` stay native. */}
        <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-input bg-muted/40 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/40 has-focus-visible:border-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
          <FileUp className="size-6 text-muted-foreground" aria-hidden />
          {fileName ? (
            <span className="font-medium break-all">{fileName}</span>
          ) : (
            <span className="font-medium">Paspauskite arba nutempkite sutartį, paraišką ar ataskaitą čia</span>
          )}
          <span className="text-sm text-muted-foreground">PDF, JPG arba PNG, iki 4 MB</span>
          <input
            type="file"
            name="file"
            accept=".pdf,.jpg,.jpeg,.png"
            required
            aria-label="Paramos sutartis, paraiška ar ataskaita (PDF, JPG arba PNG, iki 4 MB)"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={loading}>
            {loading && <LoaderCircle className="animate-spin" aria-hidden />}
            {loading ? "Nuskaitoma… (gali užtrukti iki minutės)" : "Nuskaityti dokumentą"}
          </Button>
          {/* Pre-read result of public/pavyzdine-sutartis.pdf: instant, no API call. */}
          <Button type="button" size="lg" variant="outline" disabled={loading} onClick={() => { setError(""); setData(sample as DocumentData); }}>
            Išbandyti su pavyzdine sutartimi
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Neturite sutarties po ranka?{" "}
          <a href="/pavyzdine-sutartis.pdf" download className="underline underline-offset-4 hover:text-foreground">Atsisiųskite pavyzdinę sutartį</a>{" "}
          ir įkelkite ją patys.
        </p>
        {error && (
          <Alert variant="destructive">
            <TriangleExclamationPoint aria-hidden />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>

      <details open={manualOpen} onToggle={(e) => setManualOpen(e.currentTarget.open)} className="group rounded-xl border bg-card">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
          Neturite dokumento? Užpildykite rankiniu būdu
          <Plus className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" aria-hidden />
        </summary>
        <form
          className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const rules = programs.find((p) => p.id === new FormData(e.currentTarget).get("programId"));
            if (rules) setData(manualStart(rules));
          }}
        >
          <Field label="Paramos programa" className="flex-1">
            <Select name="programId" defaultValue={programs[0]?.id} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pasirinkite programą" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Button type="submit" variant="secondary">Pildyti</Button>
        </form>
      </details>

      {showEditor && (
        <form onSubmit={onSave} className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Patikrinkite, pataisykite ir papildykite duomenis</h2>
            <p className="mt-1 text-sm text-muted-foreground">Duomenys saugomi tik jūsų naršyklėje.</p>
          </div>

          {(data.note || missing.length > 0) && (
            <Alert>
              <TriangleExclamationPoint aria-hidden />
              <AlertDescription>
                {data.note && <p>{data.note} Patikrinkite šias reikšmes.</p>}
                {missing.length > 0 && <p>Dokumente neradome {missing.join(", ")}. Įveskite jas patys.</p>}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle><h3>Projekto duomenys</h3></CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Programa"><Input value={data.program.name} onChange={(e) => setProgram({ name: e.target.value })} required /></Field>
              <Field label="Institucija"><Input value={data.program.agency} onChange={(e) => setProgram({ agency: e.target.value })} /></Field>
              <Field label="Sutarties pasirašymo data"><Input type="date" value={data.inputs.contractSignedDate} onChange={(e) => setInput({ contractSignedDate: e.target.value })} required /></Field>
              <Field label="Projekto pabaigos data"><Input type="date" value={data.inputs.projectEndDate} onChange={(e) => setInput({ projectEndDate: e.target.value })} required /></Field>
              <Field label="Paramos suma (EUR)"><Input type="number" min={0} step="0.01" value={data.inputs.grantAmount} onChange={(e) => setInput({ grantAmount: Number(e.target.value) })} required /></Field>
              <Field label="Pažadėtų naujų darbo vietų skaičius"><Input type="number" min={0} step={1} value={data.inputs.promisedJobs} onChange={(e) => setInput({ promisedJobs: Number(e.target.value) })} required /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle><h3>Kas tinka jūsų projektui</h3></CardTitle>
              <CardDescription>Pažymėkite, kas tinka. Nuo to priklauso, kurie įsipareigojimai jums taikomi.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {FLAGS.map((k) => (
                <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-accent/50">
                  <Checkbox checked={Boolean(data.inputs[k])} onCheckedChange={(v) => setInput({ [k]: v === true })} />
                  {FLAG_LABELS[k]}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle><h3>Įsipareigojimai ({data.program.obligations.length})</h3></CardTitle>
              <CardDescription>
                {data.rulesFrom
                  ? `Įtrauktos programos „${data.rulesFrom}“ bendrosios taisyklės. Jei kažko trūksta, pridėkite savo tikslą apačioje.`
                  : "Programos bendrųjų taisyklių neradome. Rodomi tik dokumente rasti įsipareigojimai."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data.program.obligations.map((o, i) => {
                const open = openIds.includes(o.id);
                return (
                  <div key={o.id} className="flex flex-col gap-4 rounded-lg border p-3 sm:p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <p className="font-medium">{o.title || "Be pavadinimo"}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                          <RiskBadge risk={o.risk} />
                          <span>{deadlineText(o)}</span>
                          {o.condition && <span>· taikoma tik jei {CONDITION_LABELS[o.condition]}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!ruleIds.has(o.id) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-10"
                            aria-expanded={open}
                            onClick={() => setOpenIds((ids) => (open ? ids.filter((x) => x !== o.id) : [...ids, o.id]))}
                          >
                            {open ? <X aria-hidden /> : <Pencil aria-hidden />}
                            {open ? "Uždaryti" : "Taisyti"}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setObligations((list) => list.filter((_, j) => j !== i))}
                        >
                          <Trash aria-hidden />
                          Pašalinti
                        </Button>
                      </div>
                    </div>
                    {open && (
                      <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                        <Field label="Tikslas ar įsipareigojimas" className="sm:col-span-2"><Input value={o.title} onChange={(e) => setOb(i, { title: e.target.value })} required placeholder="Pvz.: Pasiekti 20 % eksporto pajamų" /></Field>
                        <Field label="Už ką / ką tiksliai reikia padaryti" className="sm:col-span-2"><Textarea value={o.plainExplanation} onChange={(e) => setOb(i, { plainExplanation: e.target.value })} /></Field>
                        <Field label="Tikslus terminas (iki kada)" className="sm:col-span-2"><Input type="date" value={o.fixedDate ?? ""} onChange={(e) => setOb(i, { fixedDate: e.target.value })} /></Field>
                        <Field label="Arba terminas skaičiuojamas nuo">
                          <Choice value={o.startsFrom} onChange={(v) => setOb(i, { startsFrom: v })} disabled={!!o.fixedDate} options={{ contract_signed: "sutarties pasirašymo", project_end: "projekto pabaigos" }} />
                        </Field>
                        <Field label="Po kiek mėnesių"><Input type="number" step={1} value={o.offsetMonths} onChange={(e) => setOb(i, { offsetMonths: Number(e.target.value) })} disabled={!!o.fixedDate} required /></Field>
                        <Field label="Kartojasi">
                          <Choice value={o.recurring} onChange={(v) => setOb(i, { recurring: v })} options={{ none: "ne", yearly: "kasmet" }} />
                        </Field>
                        <Field label="Kiek kartų"><Input type="number" min={1} step={1} value={o.recurringYears ?? 1} onChange={(e) => setOb(i, { recurringYears: Number(e.target.value) })} disabled={o.recurring === "none"} /></Field>
                        <Field label="Rizika" className="sm:col-span-2">
                          <Choice value={o.risk} onChange={(v) => setOb(i, { risk: v })} options={{ high: "didelė", medium: "vidutinė", low: "maža" }} />
                        </Field>
                        <Field label="Pasekmė, jei nepadarysite" className="sm:col-span-2"><Textarea value={o.consequence} onChange={(e) => setOb(i, { consequence: e.target.value })} /></Field>
                        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
                          <Field label="Šaltinis"><Input value={o.source.document} onChange={(e) => setOb(i, { source: { ...o.source, document: e.target.value } })} /></Field>
                          <Field label="Puslapis"><Input type="number" min={0} value={o.source.page} onChange={(e) => setOb(i, { source: { ...o.source, page: Number(e.target.value) } })} /></Field>
                          <Field label="Punktas"><Input value={o.source.clause} onChange={(e) => setOb(i, { source: { ...o.source, clause: e.target.value } })} /></Field>
                        </div>
                        <Field label="Įrodymai (po vieną eilutėje)" className="sm:col-span-2"><Textarea rows={3} value={o.evidence.join("\n")} onChange={(e) => setOb(i, { evidence: e.target.value.split("\n") })} /></Field>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex flex-col gap-3 rounded-lg border border-dashed border-input bg-muted/30 p-3 sm:p-4">
                <p className="text-sm font-medium">Pridėti savo tikslą</p>
                <div className="grid gap-3 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
                  <Field label="Ką reikia pasiekti">
                    <Input
                      value={goal.title}
                      onChange={(e) => setGoal({ ...goal, title: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGoal(); } }}
                      placeholder="Pvz.: Pasiekti 20 % eksporto pajamų"
                    />
                  </Field>
                  <Field label="Iki kada">
                    <Input type="date" value={goal.date} onChange={(e) => setGoal({ ...goal, date: e.target.value })} />
                  </Field>
                  <Button type="button" variant="outline" onClick={addGoal} disabled={!goal.title.trim() || !goal.date}>
                    <Plus aria-hidden />
                    Pridėti
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full sm:w-auto sm:self-end">
            Patvirtinti ir rodyti mano įsipareigojimus
          </Button>
        </form>
      )}
    </div>
  );
}
