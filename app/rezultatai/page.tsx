import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AskBox from "@/components/AskBox";
import ResultsHeader from "@/components/ResultsHeader";
import Timeline from "@/components/Timeline";
import UploadedResults from "@/components/UploadedResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeObligations } from "@/lib/obligations";
import { getProgram } from "@/lib/programs";
import type { UserInputs } from "@/lib/types";

// Page depends on the URL query, so it renders per request instead of being prerendered.
export const instant = false;

const isDate =(s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));

const back = (label: string) => (
  <Button asChild variant="ghost" size="sm" className="-ml-2 h-10 self-start text-muted-foreground">
    <Link href="/">
      <ArrowLeft aria-hidden />
      {label}
    </Link>
  </Button>
);

const shell = "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6";

export default async function ResultsPage({ searchParams }: PageProps<"/rezultatai">) {
  const q = await searchParams;
  const str = (k: string) => (typeof q[k] === "string" ? (q[k] as string) : "");

  const inputs: UserInputs = {
    programId: str("programId"),
    contractSignedDate: str("contractSignedDate"),
    projectEndDate: str("projectEndDate"),
    grantAmount: Number(str("grantAmount")) || 0,
    promisedJobs: Number(str("promisedJobs")) || 0,
    isSme: str("isSme") === "1",
    boughtEquipment: str("boughtEquipment") === "1",
    boughtRealEstate: str("boughtRealEstate") === "1",
    boughtIntangible: str("boughtIntangible") === "1",
    generatesRevenue: str("generatesRevenue") === "1",
    vatEligible: str("vatEligible") === "1",
    contractingAuthority: str("contractingAuthority") === "1",
  };
  if (str("saltinis") === "dokumentas") {
    return (
      <main className={shell}>
        {back("Įkelti kitą dokumentą")}
        <UploadedResults />
      </main>
    );
  }

  const program = getProgram(inputs.programId);

  if (!program || !isDate(inputs.contractSignedDate) || !isDate(inputs.projectEndDate)) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle><h1 className="text-lg">Trūksta duomenų arba jie neteisingi</h1></CardTitle>
            <CardDescription>Grįžkite į pradžią ir įkelkite sutartį arba užpildykite duomenis rankiniu būdu.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Grįžti į pradžią</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const obligations = computeObligations(program, inputs);

  return (
    <main className={shell}>
      {back("Keisti duomenis")}
      <ResultsHeader program={program} inputs={inputs} count={obligations.length} />
      <Timeline obligations={obligations} programId={program.id} programName={program.name} glossary={program.glossary} docUrl={program.sourceDocUrl} />
      <AskBox programId={program.id} />
    </main>
  );
}
