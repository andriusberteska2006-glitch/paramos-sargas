"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Paperclip, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { deleteProof, listProofs, saveProof, type Proof } from "@/lib/proofs";
import FileThumb from "./FileThumb";

// image/* makes phones offer the photo gallery and camera; iOS also converts HEIC photos to JPEG for it.
const ACCEPT = "image/*,application/pdf,.doc,.docx,.xls,.xlsx";

const summary = "inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-md font-medium text-primary hover:text-primary/80 [&::-webkit-details-marker]:hidden";

function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL must be created and revoked together with the file
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <span className="flex items-center gap-3">
      {url && <FileThumb url={url} file={file} className="h-28 w-24 shrink-0 rounded-md border bg-muted" />}
      <span className="break-all">
        {file.name} <span className="text-muted-foreground">({Math.ceil(file.size / 1024)} KB)</span>
      </span>
    </span>
  );
}

function ProofList({ proofs, onRemove }: { proofs: Proof[]; onRemove: (p: Proof) => void }) {
  const [open, setOpen] = useState(false);
  if (!proofs.length) return null;
  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className={summary}>
        <Paperclip className="size-4" aria-hidden />
        Įrodymai ({proofs.length})
      </summary>
      {/* Previews mount only when opened, so the page does not load every photo and PDF at once. */}
      {open && (
        <div className="mt-1 flex flex-col gap-2">
          {proofs.map((p) => (
            <div key={p.id} className="relative rounded-lg border bg-card transition-colors hover:border-primary/40">
              <Link href={`/saugykla#irodymas-${p.id}`} className="flex flex-col gap-1.5 rounded-lg p-2 pr-12">
                <FilePreview file={p.file} />
                <span className="text-muted-foreground">
                  Įkelta {new Date(p.savedAt).toLocaleDateString("lt-LT")}
                  {p.comment && ` · „${p.comment}“`}
                </span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(p)}
                aria-label={`Ištrinti įrodymą ${p.file.name}`}
                title="Ištrinti"
                className="absolute top-1 right-1 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <X aria-hidden />
              </Button>
            </div>
          ))}
        </div>
      )}
    </details>
  );
}

function ProofForm({ existing, onSave }: { existing: Proof[]; onSave: (file: File, comment: string) => Promise<boolean> }) {
  const [file, setFile] = useState<File | null>(null);
  const duplicate = file && existing.some((p) => p.file.name === file.name && p.file.size === file.size);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!file || !(await onSave(file, String(new FormData(form).get("comment") ?? "").trim()))) return;
    form.reset();
    setFile(null);
    form.closest("details")?.removeAttribute("open");
  }

  return (
    <details className="w-full">
      <summary className={summary}>
        <Plus className="size-4" aria-hidden />
        {existing.length ? "Pridėti dar vieną įrodymą" : "Pridėti įrodymą"}
      </summary>
      <form onSubmit={submit} className="mt-1 flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
        <Input
          type="file"
          name="file"
          accept={ACCEPT}
          required
          aria-label="Nuotrauka arba failas"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="cursor-pointer py-1"
        />
        {file && (
          <div className="rounded-lg border bg-card p-2">
            <p className="mb-1 text-muted-foreground">Pasirinkta:</p>
            <FilePreview file={file} />
          </div>
        )}
        {duplicate && <p role="alert" className="text-risk-medium">Šis failas jau įkeltas prie šio punkto.</p>}
        <Input type="text" name="comment" maxLength={300} placeholder="Trumpas komentaras (nebūtina)" aria-label="Komentaras" />
        <Button type="submit" className="self-start">
          Išsaugoti
        </Button>
      </form>
    </details>
  );
}

export default function EvidenceChecklist({
  programId,
  programName,
  obligationId,
  obligationTitle,
  items,
}: {
  programId: string;
  programName: string;
  obligationId: string;
  obligationTitle: string;
  items: string[];
}) {
  const key = `paramos-sargas:checklist:${programId}:${obligationId}`;
  const [checked, setChecked] = useState<string[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [error, setError] = useState("");

  // Read after mount so server and client render the same HTML.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage after mount
      if (Array.isArray(saved)) setChecked(saved);
    } catch {}
    listProofs()
      .then((all) => setProofs(all.filter((p) => p.programId === programId && p.obligationId === obligationId)))
      .catch(() => {});
  }, [key, programId, obligationId]);

  function save(next: string[]) {
    setChecked(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }

  function toggle(item: string) {
    save(checked.includes(item) ? checked.filter((i) => i !== item) : [...checked, item]);
  }

  async function addProof(item: string, file: File, comment: string) {
    const proof: Proof = {
      // Not crypto.randomUUID: it is missing on plain-http pages, e.g. a phone opening the dev server over Wi-Fi.
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      programId,
      programName,
      obligationId,
      obligationTitle,
      item,
      comment,
      savedAt: new Date().toISOString(),
      file,
    };
    try {
      await saveProof(proof);
    } catch {
      setError("Nepavyko išsaugoti failo. Gali trūkti vietos naršyklėje.");
      return false;
    }
    setError("");
    setProofs((prev) => [...prev, proof]);
    if (!checked.includes(item)) save([...checked, item]);
    return true;
  }

  async function removeProof(p: Proof) {
    if (!confirm(`Ištrinti įrodymą „${p.file.name}“?`)) return;
    try {
      await deleteProof(p.id);
    } catch {
      setError("Nepavyko ištrinti įrodymo.");
      return;
    }
    setProofs((prev) => prev.filter((x) => x.id !== p.id));
  }

  return (
    <ul className="flex flex-col gap-3">
      {error && <li role="alert" className="text-sm text-destructive">{error}</li>}
      {items.map((item) => {
        const mine = proofs.filter((p) => p.item === item);
        const done = checked.includes(item);
        return (
          <li key={item} className="flex flex-col gap-0.5">
            <label className="flex min-h-8 cursor-pointer items-start gap-3 py-1 text-sm">
              <Checkbox className="mt-px" checked={done} onCheckedChange={() => toggle(item)} />
              <span className={done ? "text-muted-foreground line-through decoration-muted-foreground/60" : ""}>{item}</span>
            </label>
            <div className="ml-[30px] flex flex-col text-sm">
              <ProofList proofs={mine} onRemove={removeProof} />
              <ProofForm existing={mine} onSave={(file, comment) => addProof(item, file, comment)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
