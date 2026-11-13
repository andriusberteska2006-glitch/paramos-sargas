"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONDITION_LABELS, FLAGS, FLAG_LABELS } from "@/lib/flags";
import type { Flag, ObligationTemplate, Program, UserInputs } from "@/lib/types";

export const STORAGE_KEY = "paramos-sargas:dokumentas";
/** rulesFrom = name of the /data program whose general rules were merged in. */
export type DocumentData = { program: Program; inputs: UserInputs; rulesFrom?: string | null };

const field = "block w-full rounded border border-gray-300 px-3 py-2";

const RISK_LABEL = { high: "didelė rizika", medium: "vidutinė rizika", low: "maža rizika" } as const;

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

export default function DocumentUpload({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [data, setData] = useState<DocumentData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  // Closing the manual section hides its editor too (data is kept for when it is reopened).
  const showEditor = data && (!data.program.id.startsWith("rankinis-") || manualOpen);
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
      <form onSubmit={onUpload} className="flex flex-col gap-2">
        <label>
          Paramos sutartis (PDF, JPG arba PNG, iki 4 MB)
          <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" required className={field} />
        </label>
        <button type="submit" disabled={loading} className="self-start rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">
          {loading ? "Nuskaitoma… (gali užtrukti iki minutės)" : "Nuskaityti dokumentą"}
        </button>
        {error && <p role="alert" className="text-red-700">{error}</p>}
      </form>

      <details open={manualOpen} onToggle={(e) => setManualOpen(e.currentTarget.open)}>
        <summary className="cursor-pointer text-blue-700 underline">Neturite dokumento? Užpildykite rankiniu būdu</summary>
        <form
          className="mt-4 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const rules = programs.find((p) => p.id === new FormData(e.currentTarget).get("programId"));
            if (rules) setData(manualStart(rules));
          }}
        >
          <label>
            Paramos programa
            <select name="programId" required className={field}>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="self-start rounded bg-blue-700 px-4 py-2 text-white">Pildyti</button>
        </form>
      </details>

      {showEditor && (
        <form onSubmit={onSave} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Patikrinkite, pataisykite ir papildykite duomenis</h2>

          <label>Programa<input value={data.program.name} onChange={(e) => setProgram({ name: e.target.value })} required className={field} /></label>
          <label>Institucija<input value={data.program.agency} onChange={(e) => setProgram({ agency: e.target.value })} className={field} /></label>
          <label>Sutarties pasirašymo data<input type="date" value={data.inputs.contractSignedDate} onChange={(e) => setInput({ contractSignedDate: e.target.value })} required className={field} /></label>
          <label>Projekto pabaigos data<input type="date" value={data.inputs.projectEndDate} onChange={(e) => setInput({ projectEndDate: e.target.value })} required className={field} /></label>
          <label>Paramos suma (EUR)<input type="number" min={0} step="0.01" value={data.inputs.grantAmount} onChange={(e) => setInput({ grantAmount: Number(e.target.value) })} required className={field} /></label>
          <label>Pažadėtų naujų darbo vietų skaičius<input type="number" min={0} step={1} value={data.inputs.promisedJobs} onChange={(e) => setInput({ promisedJobs: Number(e.target.value) })} required className={field} /></label>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-medium">Kas tinka jūsų projektui</legend>
            {FLAGS.map((k) => (
              <label key={k} className="flex items-center gap-2">
                <input type="checkbox" checked={Boolean(data.inputs[k])} onChange={(e) => setInput({ [k]: e.target.checked })} />
                {FLAG_LABELS[k]}
              </label>
            ))}
          </fieldset>

          <h2 className="text-xl font-bold">Įsipareigojimai ({data.program.obligations.length})</h2>
          <p className="text-sm text-gray-600">
            {data.rulesFrom
              ? `Įtrauktos programos „${data.rulesFrom}“ bendrosios taisyklės. Jei kažko trūksta, pridėkite savo tikslą apačioje.`
              : "Programos bendrųjų taisyklių neradome. Rodomi tik sutartyje rasti įsipareigojimai."}
          </p>
          {data.program.obligations.map((o, i) => {
            const open = openIds.includes(o.id);
            return (
            <div key={o.id} className="flex flex-col gap-2 rounded border border-gray-300 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-semibold">{o.title || "Be pavadinimo"}</p>
                  <p className="text-sm">
                    {deadlineText(o)} · {RISK_LABEL[o.risk]}
                    {o.condition && ` · taikoma tik jei ${CONDITION_LABELS[o.condition]}`}
                  </p>
                </div>
                <div className="flex gap-3">
                  {!ruleIds.has(o.id) && (
                    <button
                      type="button"
                      onClick={() => setOpenIds((ids) => (open ? ids.filter((x) => x !== o.id) : [...ids, o.id]))}
                      className="text-blue-700 underline"
                    >
                      {open ? "Uždaryti" : "Taisyti"}
                    </button>
                  )}
                  <button type="button" onClick={() => setObligations((list) => list.filter((_, j) => j !== i))} className="text-red-700 underline">
                    Pašalinti
                  </button>
                </div>
              </div>
              {open && (
              <>
              <label>Tikslas ar įsipareigojimas<input value={o.title} onChange={(e) => setOb(i, { title: e.target.value })} required placeholder="Pvz.: Pasiekti 20 % eksporto pajamų" className={field} /></label>
              <label>Už ką / ką tiksliai reikia padaryti<textarea value={o.plainExplanation} onChange={(e) => setOb(i, { plainExplanation: e.target.value })} className={field} /></label>
              <label>Tikslus terminas (iki kada)<input type="date" value={o.fixedDate ?? ""} onChange={(e) => setOb(i, { fixedDate: e.target.value })} className={field} /></label>
              <div className="grid grid-cols-2 gap-2">
                <label>arba terminas skaičiuojamas nuo
                  <select value={o.startsFrom} onChange={(e) => setOb(i, { startsFrom: e.target.value as ObligationTemplate["startsFrom"] })} disabled={!!o.fixedDate} className={field}>
                    <option value="contract_signed">sutarties pasirašymo</option>
                    <option value="project_end">projekto pabaigos</option>
                  </select>
                </label>
                <label>Po kiek mėnesių<input type="number" step={1} value={o.offsetMonths} onChange={(e) => setOb(i, { offsetMonths: Number(e.target.value) })} disabled={!!o.fixedDate} required className={field} /></label>
                <label>Kartojasi
                  <select value={o.recurring} onChange={(e) => setOb(i, { recurring: e.target.value as ObligationTemplate["recurring"] })} className={field}>
                    <option value="none">ne</option>
                    <option value="yearly">kasmet</option>
                  </select>
                </label>
                <label>Kiek kartų<input type="number" min={1} step={1} value={o.recurringYears ?? 1} onChange={(e) => setOb(i, { recurringYears: Number(e.target.value) })} disabled={o.recurring === "none"} className={field} /></label>
              </div>
              <label>Rizika
                <select value={o.risk} onChange={(e) => setOb(i, { risk: e.target.value as ObligationTemplate["risk"] })} className={field}>
                  <option value="high">didelė</option>
                  <option value="medium">vidutinė</option>
                  <option value="low">maža</option>
                </select>
              </label>
              <label>Pasekmė, jei nepadarysite<textarea value={o.consequence} onChange={(e) => setOb(i, { consequence: e.target.value })} className={field} /></label>
              <div className="grid grid-cols-3 gap-2">
                <label>Šaltinis<input value={o.source.document} onChange={(e) => setOb(i, { source: { ...o.source, document: e.target.value } })} className={field} /></label>
                <label>Puslapis<input type="number" min={0} value={o.source.page} onChange={(e) => setOb(i, { source: { ...o.source, page: Number(e.target.value) } })} className={field} /></label>
                <label>Punktas<input value={o.source.clause} onChange={(e) => setOb(i, { source: { ...o.source, clause: e.target.value } })} className={field} /></label>
              </div>
              <label>Įrodymai (po vieną eilutėje)<textarea rows={3} value={o.evidence.join("\n")} onChange={(e) => setOb(i, { evidence: e.target.value.split("\n") })} className={field} /></label>
              </>
              )}
            </div>
            );
          })}

          <div className="flex flex-col gap-2 rounded border border-dashed border-gray-400 p-3">
            <p className="font-medium">Pridėti savo tikslą</p>
            <label>
              Ką reikia pasiekti
              <input
                value={goal.title}
                onChange={(e) => setGoal({ ...goal, title: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGoal(); } }}
                placeholder="Pvz.: Pasiekti 20 % eksporto pajamų"
                className={field}
              />
            </label>
            <label>
              Iki kada
              <input type="date" value={goal.date} onChange={(e) => setGoal({ ...goal, date: e.target.value })} className={field} />
            </label>
            <button type="button" onClick={addGoal} disabled={!goal.title.trim() || !goal.date} className="self-start rounded border border-blue-700 px-3 py-1 text-blue-700 disabled:opacity-50">
              Pridėti
            </button>
          </div>

          <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-white">Patvirtinti ir rodyti mano įsipareigojimus</button>
        </form>
      )}
    </div>
  );
}
