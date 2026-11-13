"use client";

import { useEffect, useState } from "react";
import type { AskResponse, Program } from "@/lib/types";

// Shown when the page was opened from a tag on the equipment (?zyma=...): the questions people ask standing next to it.
const TAG_QUESTIONS = [
  "Ar galiu parduoti šią įrangą?",
  "Ar galiu perkelti ją į kitą adresą ar padalinį?",
  "Ar galiu ją išnuomoti ar paskolinti?",
  "Įranga sugedo arba pavogta. Ką daryti?",
];

/** `program` is sent along for programs read from an uploaded document (not in /data). */
export default function AskBox({ programId, program }: { programId: string; program?: Program }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromTag, setFromTag] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL after mount
  useEffect(() => setFromTag(new URLSearchParams(location.search).has("zyma")), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, question, program }),
      });
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setError("Nepavyko gauti atsakymo. Bandykite dar kartą.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Klauskite: „Ar galiu…?“</h2>
      {fromTag && (
        <div className="flex flex-wrap gap-2">
          {TAG_QUESTIONS.map((q) => (
            <button key={q} type="button" onClick={() => setQuestion(q)} className="rounded-full border border-blue-700 px-3 py-1 text-sm text-blue-700">
              {q}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <label htmlFor="ask-question" className="sr-only">Jūsų klausimas</label>
        <textarea
          id="ask-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          maxLength={2000}
          placeholder="Pvz.: Ar galiu parduoti įrangą po 3 metų?"
          className="rounded border border-gray-300 px-3 py-2"
        />
        <button type="submit" disabled={loading} className="self-start rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">
          {loading ? "Ieškoma…" : "Klausti"}
        </button>
      </form>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {result && (
        <div aria-live="polite" className="rounded border border-gray-300 p-3">
          <p>{result.answer}</p>
          <ul className="mt-2 text-sm text-gray-600">
            {result.sources.map((s, i) => {
              const text = `Šaltinis: ${s.document}, ${s.page} psl., ${s.clause}`;
              const anchor = `isipareigojimas-${s.obligationId}`;
              // The card is missing when its condition doesn't apply to this user; show plain text then.
              return (
                <li key={i}>
                  {document.getElementById(anchor) ? (
                    <a href={`#${anchor}`} className="text-blue-700 underline hover:text-blue-900">{text}</a>
                  ) : (
                    text
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
