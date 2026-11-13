import { Info } from "lucide-react";
import ProofVault from "@/components/ProofVault";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function VaultPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Įrodymų saugykla</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Visi įkelti įrodymai: čekiai, sąskaitos, nuotraukos ir jūsų komentarai.</p>
      </div>
      <Alert role="note" className="border-primary/20 bg-accent/50 px-4 py-3">
        <Info aria-hidden className="text-primary" />
        <AlertTitle>Failai saugomi tik šioje naršyklėje</AlertTitle>
        <AlertDescription>
          Į serverį jie nesiunčiami. Išvalius naršyklės duomenis jie dings, todėl svarbius failus laikykite ir kitur.
        </AlertDescription>
      </Alert>
      <ProofVault />
    </main>
  );
}
