"use client";

import { useRef, useState } from "react";
import {
  Bell,
  CalendarClock,
  Check,
  ClipboardCheck,
  Cpu,
  Ellipsis,
  Factory,
  FileUp,
  Paperclip,
  Store,
  Tent,
  Tractor,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program } from "@/lib/types";
import DocumentUpload from "./DocumentUpload";

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
  ["Įkelkite sutartį", "PDF, JPG arba PNG dokumentą perskaitysime automatiškai.", FileUp],
  ["Patikrinkite duomenis", "Pataisykite informaciją ir papildykite savo tikslus.", ClipboardCheck],
  ["Stebėkite terminus", "Matykite darbus laiko juostoje ir pasiruoškite įrodymus.", CalendarClock],
] as const;

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
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <p className="inline-flex rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            Paramos įsipareigojimai vienoje vietoje
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
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
                <Icon className="size-4 text-primary" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Product preview: what the user gets after uploading. */}
        <div aria-hidden className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/15 sm:p-8">
          <p className="text-2xl leading-8 font-semibold text-balance">Svarbūs terminai nepasimeta tarp dokumentų.</p>
          <div className="mt-8 flex flex-col gap-3">
            {[
              ["2026-06-30", "Pateikti projekto ataskaitą", "w-2/3"],
              ["2026-12-31", "Išlaikyti sukurtas darbo vietas", "w-1/3"],
            ].map(([date, title, progress]) => (
              <div key={title} className="rounded-2xl bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3 text-sm text-primary-foreground/75">
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="size-4" />
                    Terminas
                  </span>
                  <span className="tabular-nums">{date}</span>
                </div>
                <p className="mt-2 font-medium">{title}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div className={`h-full rounded-full bg-white/80 ${progress}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={sectorSelection}
        aria-labelledby="sector-heading"
        className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">1 žingsnis</p>
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
              className="group flex items-start gap-4 rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-accent"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-primary transition-colors group-aria-pressed:bg-primary group-aria-pressed:text-primary-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
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
          {steps.map(([title, text, Icon], i) => (
            <li key={title} className="rounded-2xl border bg-card/60 p-5">
              <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-semibold">
                {i + 1}. {title}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section ref={upload} id="sutartis" className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8">
        <p className="text-sm font-medium text-primary">{selected ? `2 žingsnis · ${selected}` : "2 žingsnis"}</p>
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
