"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Obligation } from "@/lib/types";

export default function ReminderForm({ obligations, programName }: { obligations: Obligation[]; programName: string }) {
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    const demo = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("name") === "demo";
    const deadlines = obligations.flatMap((o) => o.dates.map((date) => ({ title: o.title, date })));
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, programName, deadlines, demo }),
      });
      const json = await res.json().catch(() => ({}));
      setMsg(
        res.ok
          ? { ok: true, text: demo ? `Pavyzdinį priminimą išsiuntėme į ${email}.` : `Užsakyta. Patvirtinimo laišką išsiuntėme į ${email}.` }
          : { ok: false, text: json.error ?? "Nepavyko užsakyti priminimų." },
      );
    } catch {
      setMsg({ ok: false, text: "Nepavyko susisiekti su serveriu." });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4 text-primary" aria-hidden />
          <h2>Priminimai el. paštu</h2>
        </CardTitle>
        <CardDescription>Laišką atsiųsime likus 30 ir 7 dienoms iki kiekvieno termino.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label htmlFor="priminimu-pastas" className="sr-only">
            El. pašto adresas
          </label>
          <Input id="priminimu-pastas" type="email" name="email" required autoComplete="email" placeholder="vardas@gmail.com" />
          <Button type="submit" disabled={sending} className="w-full">
            {sending && <LoaderCircle className="animate-spin" aria-hidden />}
            {sending ? "Siunčiama…" : "Gauti priminimus"}
          </Button>
          <Button type="submit" name="demo" variant="outline" disabled={sending} className="w-full">
            Atsiųsti pavyzdinį priminimą dabar
          </Button>
          {msg && (
            <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>
              {msg.text}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
