"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AskBox from "./AskBox";
import Timeline from "./Timeline";
import { STORAGE_KEY, type DocumentData } from "./DocumentUpload";
import { computeObligations } from "@/lib/obligations";

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

  if (data === undefined) return <p>Kraunama…</p>;
  if (!data) {
    return (
      <p>
        Išsaugotų duomenų nerasta. <Link href="/" className="text-blue-700 underline">Įkelkite dokumentą</Link>
      </p>
    );
  }

  const { program, inputs } = data;
  return (
    <>
      <h1 className="text-2xl font-bold">{program.name}: jūsų įsipareigojimai</h1>
      <p>
        {program.agency && `${program.agency}. `}Parama: {inputs.grantAmount} EUR. Sutartis pasirašyta {inputs.contractSignedDate}, projektas
        baigiasi {inputs.projectEndDate}.
      </p>
      <Timeline obligations={computeObligations(program, inputs)} programId={program.id} programName={program.name} />
      <AskBox programId={program.id} program={program} />
    </>
  );
}
