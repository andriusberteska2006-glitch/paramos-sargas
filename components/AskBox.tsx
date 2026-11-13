"use client";

import { useEffect, useState } from "react";
import { FileText, LoaderCircle, MessageCircleQuestionMark, TriangleExclamationPoint } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
      const body = await res.json().catch(() => null);
      if (!res.ok || !body) throw new Error(body?.error);
      setResult(body);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Nepavyko gauti atsakymo. Bandykite dar kartą.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircleQuestionMark className="size-5 text-primary" aria-hidden />
          <h2>Klauskite: „Ar galiu…?“</h2>
        </CardTitle>
        <CardDescription>Atsakymas remiasi tik jūsų programos taisyklėmis ir nurodo šaltinius.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {fromTag && (
          <div className="flex flex-wrap gap-2">
            {TAG_QUESTIONS.map((q) => (
              <Button key={q} type="button" variant="outline" size="sm" onClick={() => setQuestion(q)} className="h-9 rounded-full">
                {q}
              </Button>
            ))}
          </div>
        )}
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label htmlFor="ask-question" className="sr-only">Jūsų klausimas</label>
          <Textarea
            id="ask-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            maxLength={2000}
            placeholder="Pvz.: Ar galiu parduoti įrangą po 3 metų?"
          />
          <Button type="submit" disabled={loading} className="self-start">
            {loading && <LoaderCircle className="animate-spin" aria-hidden />}
            {loading ? "Ieškoma…" : "Klausti"}
          </Button>
        </form>
        {error && (
          <Alert variant="destructive">
            <TriangleExclamationPoint aria-hidden />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {result && (
          <div aria-live="polite" className="rounded-lg bg-muted p-4">
            <p className="leading-relaxed whitespace-pre-line">{result.answer}</p>
            {result.sources.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1 border-t pt-3 text-sm text-muted-foreground">
                {result.sources.map((s, i) => {
                  const text = `${s.document}, ${s.page} psl., ${s.clause}`;
                  const anchor = `isipareigojimas-${s.obligationId}`;
                  // The card is missing when its condition doesn't apply to this user; show plain text then.
                  return (
                    <li key={i} className="flex items-start gap-1.5">
                      <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {document.getElementById(anchor) ? (
                        <a href={`#${anchor}`} className="text-primary underline underline-offset-4 hover:text-primary/80">{text}</a>
                      ) : (
                        text
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
