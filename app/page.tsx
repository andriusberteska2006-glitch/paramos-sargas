import DocumentUpload from "@/components/DocumentUpload";
import { programs } from "@/lib/programs";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Paramos sargas</h1>
      <p>
        Įkelkite paramos sutartį. AI ją perskaitys ir surašys terminus, sumas ir ką turite padaryti, kad neprarastumėte paramos.
        Viską galėsite patikrinti ir pataisyti.
      </p>
      <DocumentUpload programs={programs} />
    </main>
  );
}
