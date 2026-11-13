"use client";

import { useRef } from "react";
import { Bell, CalendarClock, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program, Risk } from "@/lib/types";
import DocumentUpload from "./DocumentUpload";
import RiskBadge from "./RiskBadge";

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
  const upload = useRef<HTMLElement>(null);
  const toUpload = () => upload.current?.scrollIntoView({ block: "start" });

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
          <Button size="lg" onClick={toUpload} className="mt-8">
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

      <section id="kaip-veikia" aria-label="Kaip tai veikia" className="pb-12">
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
        <h2 className="text-2xl font-semibold tracking-tight">Įkelkite paramos sutartį, paraišką ar ataskaitą</h2>
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
