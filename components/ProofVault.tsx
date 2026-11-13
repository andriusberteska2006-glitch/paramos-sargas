"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FolderOpen, Trash, TriangleExclamationPoint } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  if (rows === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Kraunama">
        {[0, 1].map((i) => <Skeleton key={i} className="h-96 rounded-xl" />)}
      </div>
    );
  }
  if (rows === null) {
    return (
      <Alert variant="destructive">
        <TriangleExclamationPoint aria-hidden />
        <AlertDescription>Nepavyko atidaryti saugyklos šioje naršyklėje.</AlertDescription>
      </Alert>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
        <FolderOpen className="size-6 text-muted-foreground" aria-hidden />
        <p className="font-medium">Įrodymų dar nėra</p>
        <p className="max-w-sm text-sm text-muted-foreground">Juos pridėsite prie įsipareigojimų kortelių punktų.</p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/rezultatai?saltinis=dokumentas">Eiti į įsipareigojimus</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {rows.map((r) => {
        const id = `irodymas-${r.id}`;
        return (
          <li key={r.id}>
            <Card id={id} className={`h-full gap-0 py-0 ${target === id ? "ring-2 ring-ring" : ""}`}>
              <FileThumb url={r.url} file={r.file} className="h-56 w-full border-b bg-muted" />
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <p className="text-xs text-muted-foreground">
                  {new Date(r.savedAt).toLocaleString("lt-LT")} · {r.programName}
                </p>
                <h2 className="leading-snug font-semibold">{r.obligationTitle}</h2>
                <p className="text-sm">{r.item}</p>
                {r.comment && <p className="text-sm text-muted-foreground italic">„{r.comment}“</p>}
                <p className="truncate text-xs text-muted-foreground" title={r.file.name}>{r.file.name}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <Button asChild variant="outline">
                    <a href={r.url} target="_blank">
                      <ExternalLink aria-hidden />
                      Atidaryti
                    </a>
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => remove(r)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash aria-hidden />
                    Ištrinti
                  </Button>
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
