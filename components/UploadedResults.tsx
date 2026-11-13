"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { computeObligations } from "@/lib/obligations";
import AskBox from "./AskBox";
import ReminderForm from "./ReminderForm";
import { STORAGE_KEY, type DocumentData } from "./DocumentUpload";
import ResultsHeader from "./ResultsHeader";
import Timeline from "./Timeline";

export default function UploadedResults() {
  // undefined = not read yet, null = nothing saved
  const [data, setData] = useState<DocumentData | null | undefined>(undefined);

  // Read after mount so server and client render the same HTML.
  useEffect(() => {
    let saved: DocumentData | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    } catch {}
    const isDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage after mount
    setData(saved?.program && isDate(saved.inputs?.contractSignedDate) && isDate(saved.inputs?.projectEndDate) ? saved : null);
  }, []);

  if (data === undefined) {
    return (
      <div className="flex flex-col gap-5" aria-busy="true" aria-label="Kraunama">
        <Skeleton className="h-9 w-2/3" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[4.5rem] rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }
  if (!data) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle><h1 className="text-lg">Išsaugotų duomenų nerasta</h1></CardTitle>
          <CardDescription>Įkelkite paramos sutartį arba užpildykite duomenis rankiniu būdu. Jie bus išsaugoti tik šioje naršyklėje.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/#sutartis">Įkelti dokumentą</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { program, inputs } = data;
  const obligations = computeObligations(program, inputs);
  return (
    <>
      <ResultsHeader program={program} inputs={inputs} count={obligations.length} />
      <Timeline obligations={obligations} programId={program.id} programName={program.name} glossary={program.glossary} docUrl={program.sourceDocUrl} />
      {/* Only the obligations that apply, with their computed dates, so answers can name exact deadlines. */}
      <AskBox programId={program.id} program={{ ...program, obligations }} />
      <ReminderForm obligations={obligations} programName={program.name} />
    </>
  );
}
