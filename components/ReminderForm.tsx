"use client";

import { useState, type FormEvent } from "react";
import type { Obligation } from "@/lib/types";

export default function ReminderForm({ obligations, programName }: { obligations: Obligation[]; programName: string }) {
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    const deadlines = obligations.flatMap((o) => o.dates.map((date) => ({ title: o.title, date })));
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, programName, deadlines }),
      });
      const json = await res.json().catch(() => ({}));
      setMsg(
        res.ok
          ? { ok: true, text: `Užsakyta. Patvirtinimo laišką išsiuntėme į ${email}.` }
          : { ok: false, text: json.error ?? "Nepavyko užsakyti priminimų." },
      );
    } catch {
      setMsg({ ok: false, text: "Nepavyko susisiekti su serveriu." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-2 border-t border-gray-300 pt-4">
      <label htmlFor="priminimu-pastas" className="font-semibold">
        Priminimai el. paštu
      </label>
      <p className="text-sm">Laišką atsiųsime likus 30 ir 7 dienoms iki kiekvieno termino.</p>
      <input
        id="priminimu-pastas"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="vardas@gmail.com"
        className="rounded border border-gray-300 p-2"
      />
      <button type="submit" disabled={sending} className="rounded bg-blue-700 px-3 py-2 text-white disabled:opacity-50">
        {sending ? "Siunčiama…" : "Gauti priminimus"}
      </button>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>
          {msg.text}
        </p>
      )}
    </form>
  );
}
