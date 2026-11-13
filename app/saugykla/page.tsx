import Link from "next/link";
import ProofVault from "@/components/ProofVault";

export default function VaultPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
      <Link href="/rezultatai?saltinis=dokumentas" className="text-blue-700 underline">← Mano įsipareigojimai</Link>
      <h1 className="text-2xl font-bold">Įrodymų saugykla</h1>
      <p>
        Visi įkelti įrodymai: čekiai, sąskaitos, nuotraukos ir jūsų komentarai. Failai saugomi tik šioje naršyklėje ir į
        serverį nesiunčiami. Išvalius naršyklės duomenis jie dings, todėl svarbius failus laikykite ir kitur.
      </p>
      <ProofVault />
    </main>
  );
}
