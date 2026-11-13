import Link from "next/link";
import AskBox from "@/components/AskBox";
import Timeline from "@/components/Timeline";
import UploadedResults from "@/components/UploadedResults";
import { computeObligations } from "@/lib/obligations";
import { getProgram } from "@/lib/programs";
import type { UserInputs } from "@/lib/types";

// Page depends on the URL query, so it renders per request instead of being prerendered.
export const instant = false;

const isDate =(s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));

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
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
        <nav className="flex flex-wrap justify-between gap-2">
          <Link href="/" className="text-blue-700 underline">← Įkelti kitą dokumentą</Link>
          <Link href="/saugykla" className="text-blue-700 underline">Įrodymų saugykla</Link>
        </nav>
        <UploadedResults />
      </main>
    );
  }

  const program = getProgram(inputs.programId);

  if (!program || !isDate(inputs.contractSignedDate) || !isDate(inputs.projectEndDate)) {
    return (
      <main className="mx-auto w-full max-w-2xl p-4">
        <p className="mb-4">Trūksta duomenų arba jie neteisingi.</p>
        <Link href="/" className="text-blue-700 underline">← Grįžti į formą</Link>
      </main>
    );
  }

  const obligations = computeObligations(program, inputs);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      <nav className="flex flex-wrap justify-between gap-2">
        <Link href="/" className="text-blue-700 underline">← Keisti duomenis</Link>
        <Link href="/saugykla" className="text-blue-700 underline">Įrodymų saugykla</Link>
      </nav>
      <h1 className="text-2xl font-bold">{program.name}: jūsų įsipareigojimai</h1>
      <Timeline obligations={obligations} programId={program.id} programName={program.name} glossary={program.glossary} docUrl={program.sourceDocUrl} />
      <AskBox programId={program.id} />
    </main>
  );
}
