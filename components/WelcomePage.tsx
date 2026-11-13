"use client";

import { useRef, useState } from "react";
import {
  Bell,
  CalendarClock,
  Check,
  Cpu,
  Ellipsis,
  Factory,
  Paperclip,
  Store,
  Tent,
  Tractor,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program, Risk } from "@/lib/types";
import DocumentUpload from "./DocumentUpload";
import RiskBadge from "./RiskBadge";

const sectors = [
  ["Prekyba ir paslaugos", "Parduotuvėms, salonams ir paslaugų verslams.", Store],
  ["Gamyba", "Dirbtuvėms, gamintojams ir įrangos projektams.", Factory],
  ["Technologijos", "Programinei įrangai, inovacijoms ir startuoliams.", Cpu],
  ["Žemės ūkis", "Ūkiams, maisto gamybai ir kaimo verslams.", Tractor],
  ["Turizmas ir kultūra", "Apgyvendinimui, renginiams ir kūrybinėms veikloms.", Tent],
  ["Jaunimo organizacija", "Jaunimo organizacijoms ir jauniesiems verslininkams.", Users],
  ["Kita veikla", "Jei savo srities sąraše nerandate.", Ellipsis],
] as const;

const steps = [
  ["Įkelkite sutartį", "PDF, JPG arba PNG dokumentą perskaitysime automatiškai."],
  ["Patikrinkite duomenis", "Pataisykite informaciją ir papildykite savo tikslus."],
  ["Stebėkite terminus", "Matykite darbus laiko juostoje ir pasiruoškite įrodymus."],
] as const;

// Decorative sample of the results page, so the hero shows the real product instead of an illustration.
const preview: [string, string, Risk][] = [
  ["2027-03-31", "Pateikti metinę ataskaitą", "medium"],
  ["2027-06-30", "Išlaikyti sukurtas darbo vietas", "high"],
  ["2028-12-31", "Nenaudoti įrangos kitai veiklai", "high"],
];

const features = [
  [CalendarClock, "Terminai laiko juostoje"],
  [Paperclip, "Įrodymai vienoje vietoje"],
  [Bell, "Priminimai el. paštu"],
] as const;

export default function WelcomePage({ programs }: { programs: Program[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const sectorSelection = useRef<HTMLElement>(null);
  const upload = useRef<HTMLElement>(null);
  const startSelection = () => sectorSelection.current?.scrollIntoView({ block: "start" });
  const continueToUpload = () => upload.current?.scrollIntoView({ block: "start" });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      <section id="pradzia" className="grid gap-10 py-14 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-24">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Paramos įsipareigojimai vienoje vietoje</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Ramiau vykdykite paramos projektą.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            Įkelkite sutartį, o mes padėsime suprasti terminus, įsipareigojimus ir tai, ką verta pasiruošti iš anksto.
          </p>
          <Button size="lg" onClick={startSelection} className="mt-8">
            Pradėti
          </Button>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {features.map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="size-4" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div aria-hidden className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          <p className="border-b px-5 py-3 text-sm font-medium text-muted-foreground">Artėjantys terminai</p>
          <ul className="divide-y">
            {preview.map(([date, title, risk]) => (
              <li key={title} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-sm text-muted-foreground tabular-nums sm:w-24 sm:shrink-0">{date}</span>
                <span className="flex-1 font-medium">{title}</span>
                <RiskBadge risk={risk} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        ref={sectorSelection}
        aria-labelledby="sector-heading"
        className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-muted-foreground">1 žingsnis</p>
            <h2 id="sector-heading" className="mt-1 text-2xl font-semibold tracking-tight">
              Kokia jūsų veiklos sritis?
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Pasirinkimas padės pritaikyti tolesnius klausimus jūsų projektui.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map(([title, description, Icon]) => (
            <button
              key={title}
              type="button"
              aria-pressed={selected === title}
              onClick={() => setSelected(title)}
              className="group flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-accent"
            >
              <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground group-aria-pressed:text-foreground" aria-hidden />
              <span>
                <span className="block font-medium">{title}</span>
                <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{description}</span>
              </span>
            </button>
          ))}
        </div>
        {selected && (
          <div className="mt-5 flex flex-col gap-3 rounded-xl bg-accent p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-accent-foreground">
              <Check className="size-4" aria-hidden />
              Pasirinkta sritis: <strong className="font-semibold">{selected}</strong>
            </p>
            <Button onClick={continueToUpload} className="self-start sm:self-auto">
              Tęsti
            </Button>
          </div>
        )}
      </section>

      <section id="kaip-veikia" aria-label="Kaip tai veikia" className="py-12">
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={title} className="border-t pt-5">
              <p className="text-sm text-muted-foreground tabular-nums">0{i + 1}</p>
              <h2 className="mt-2 font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section ref={upload} id="sutartis" className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8">
        <p className="text-sm font-medium text-muted-foreground">{selected ?`2 žingsnis · ${selected}` : "2 žingsnis"}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Įkelkite paramos sutartį</h2>
        <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
          AI suras svarbiausius terminus ir įsipareigojimus. Prieš išsaugant viską galėsite patikrinti bei pataisyti.
        </p>
        <div className="mt-6">
          <DocumentUpload programs={programs} />
        </div>
      </section>
    </main>
  );
}
