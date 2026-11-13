"use client";

import { useEffect, useState } from "react";
import { deleteProof, listProofs, type Proof } from "@/lib/proofs";
import FileThumb from "./FileThumb";

type Row = Proof & { url: string };

export default function ProofVault() {
  // undefined = loading, null = IndexedDB failed
  const [rows, setRows] = useState<Row[] | null | undefined>(undefined);
  const [target, setTarget] = useState("");

  useEffect(() => {
    let cancelled = false;
    let urls: string[] = [];
    listProofs()
      .then((all) => {
        if (cancelled) return;
        const next = all
          .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
          .map((p) => ({ ...p, url: URL.createObjectURL(p.file) }));
        urls = next.map((r) => r.url);
        setTarget(location.hash.slice(1));
        setRows(next);
      })
      .catch(() => setRows(null));
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // The list loads after navigation, so the browser's own #hash scroll already missed it.
  useEffect(() => {
    if (rows && target) document.getElementById(target)?.scrollIntoView({ block: "center" });
  }, [rows, target]);

  async function remove(r: Row) {
    if (!confirm(`Ištrinti įrodymą „${r.file.name}“?`)) return;
    try {
      await deleteProof(r.id);
    } catch {
      alert("Nepavyko ištrinti įrodymo.");
      return;
    }
    URL.revokeObjectURL(r.url);
    setRows((prev) => prev?.filter((x) => x.id !== r.id));
  }

  if (rows === undefined) return <p>Kraunama…</p>;
  if (rows === null) return <p role="alert">Nepavyko atidaryti saugyklos šioje naršyklėje.</p>;
  if (rows.length === 0) return <p>Įrodymų dar nėra. Juos pridėsite prie įsipareigojimų kortelių punktų.</p>;

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((r) => {
        const id = `irodymas-${r.id}`;
        return (
          <li key={r.id}>
            <article
              id={id}
              className={`flex flex-col gap-3 rounded border border-gray-300 p-4 sm:flex-row ${target === id ? "ring-4 ring-blue-600" : ""}`}
            >
              <FileThumb url={r.url} file={r.file} className="h-64 w-48 shrink-0 rounded border border-gray-300 bg-white" />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-sm text-gray-600">
                  {new Date(r.savedAt).toLocaleString("lt-LT")} · {r.programName}
                </p>
                <h2 className="font-semibold">{r.obligationTitle}</h2>
                <p>{r.item}</p>
                {r.comment && <p className="italic">„{r.comment}“</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <a href={r.url} target="_blank" className="break-all text-blue-700 underline">
                    Atidaryti {r.file.name}
                  </a>
                  <button type="button" onClick={() => remove(r)} className="text-red-700 underline">
                    Ištrinti
                  </button>
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
