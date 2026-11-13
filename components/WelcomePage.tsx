"use client";

import { useRef, useState } from "react";
import type { Program } from "@/lib/types";
import DocumentUpload from "./DocumentUpload";

const sectors = [
  ["Prekyba ir paslaugos", "Parduotuvėms, salonams ir paslaugų verslams.", "⌘"],
  ["Gamyba", "Dirbtuvėms, gamintojams ir įrangos projektams.", "▦"],
  ["Technologijos", "Programinei įrangai, inovacijoms ir startuoliams.", "✦"],
  ["Žemės ūkis", "Ūkiams, maisto gamybai ir kaimo verslams.", "⌁"],
  ["Turizmas ir kultūra", "Apgyvendinimui, renginiams ir kūrybinėms veikloms.", "◌"],
  ["Kita veikla", "Jei savo srities sąraše nerandate.", "→"],
] as const;

export default function WelcomePage({ programs }: { programs: Program[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const sectorSelection = useRef<HTMLElement>(null);
  const upload = useRef<HTMLElement>(null);
  const startSelection = () => sectorSelection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const continueToUpload = () => upload.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#18352d]">
      <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <a href="#pradzia" className="flex items-center gap-2 font-semibold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1e6d59] text-lg text-white">✓</span>Paramos sargas</a>
          <a href="#kaip-veikia" className="text-sm font-medium text-[#376258] hover:text-[#164c3e]">Kaip tai veikia?</a>
        </header>
        <section id="pradzia" className="grid gap-12 py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-24">
          <div><p className="mb-5 inline-flex rounded-full bg-[#dcefe7] px-4 py-2 text-sm font-semibold text-[#17614e]">Jūsų paramos įsipareigojimai vienoje vietoje</p><h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-[#12382e] sm:text-5xl lg:text-6xl">Ramiau vykdykite paramos projektą.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[#49645d]">Įkelkite sutartį, o mes padėsime suprasti terminus, įsipareigojimus ir tai, ką verta pasiruošti iš anksto.</p><button type="button" onClick={startSelection} className="mt-8 rounded-xl bg-[#1e6d59] px-6 py-3.5 font-semibold text-white shadow-sm hover:bg-[#175847]">Pradėti</button></div>
          <div className="rounded-3xl bg-[#1d6755] p-8 text-white shadow-xl shadow-[#1d6755]/15"><p className="text-sm font-semibold text-[#c3ead8]">PARAMOS SARGAS</p><p className="mt-12 text-2xl font-semibold leading-8">Svarbūs terminai nepasimeta tarp dokumentų.</p><div className="mt-8 rounded-2xl bg-white/12 p-4"><div className="flex justify-between text-sm text-[#d7f0e4]"><span>Artimiausias terminas</span><span>2026-06-30</span></div><p className="mt-2 font-medium">Pateikti projekto ataskaitą</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full w-2/3 rounded-full bg-[#bde9d5]" /></div></div></div>
        </section>
        <section ref={sectorSelection} aria-labelledby="sector-heading" className="scroll-mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#e1e8e3] sm:p-9">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-[#23715d]">PIRMAS ŽINGSNIS</p><h2 id="sector-heading" className="mt-2 text-2xl font-semibold tracking-tight text-[#173b32]">Kokia jūsų veiklos sritis?</h2></div><p className="max-w-sm text-sm leading-6 text-[#647a73]">Pasirinkimas padės pritaikyti tolesnius klausimus jūsų projektui.</p></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sectors.map(([title, description, icon]) => <button key={title} type="button" aria-pressed={selected === title} onClick={() => setSelected(title)} className={`rounded-2xl border p-5 text-left transition ${selected === title ? "border-[#25806a] bg-[#e8f5ef]" : "border-[#e2e9e5] bg-[#fcfdfb] hover:border-[#81b5a4] hover:bg-[#f2f8f5]"}`}><span className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${selected === title ? "bg-[#25806a] text-white" : "bg-[#e6f1eb] text-[#20705b]"}`}>{icon}</span><span className="mt-5 block font-semibold text-[#23453c]">{title}</span><span className="mt-1 block text-sm leading-5 text-[#6b8078]">{description}</span></button>)}</div>
          <button type="button" aria-pressed={selected === "Jaunimo verslas"} onClick={() => setSelected("Jaunimo verslas")} className={`mt-4 flex w-full items-center justify-between gap-5 rounded-2xl border p-5 text-left transition ${selected === "Jaunimo verslas" ? "border-[#d28a25] bg-[#fff5de]" : "border-[#f1d69b] bg-[#fffaf0] hover:bg-[#fff4dc]"}`}><span className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f4c965] text-xl text-[#6e450b]">★</span><span><span className="block font-semibold text-[#68440d]">Jaunimo verslas</span><span className="mt-1 block text-sm text-[#8a682d]">Skiltis pradedantiems jauniesiems verslininkams ir jų idėjoms.</span></span></span><span className="shrink-0 font-semibold text-[#7c5415]">Rinktis →</span></button>
          {selected && <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#edf7f2] p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[#28564a]">Pasirinkta sritis: <strong>{selected}</strong></p><button type="button" onClick={continueToUpload} className="self-start rounded-lg bg-[#1e6d59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#175847] sm:self-auto">Tęsti</button></div>}
        </section>
        <section id="kaip-veikia" className="grid gap-5 py-14 sm:grid-cols-3">{[["Įkelkite sutartį", "PDF, JPG arba PNG dokumentą perskaitysime automatiškai."], ["Patikrinkite duomenis", "Pataisykite informaciją ir papildykite savo tikslus."], ["Stebėkite terminus", "Matykite darbus laiko juostoje ir pasiruoškite įrodymus."]].map(([title, text], index) => <div key={title} className="rounded-2xl border border-[#e0e8e3] bg-[#fbfcfa] p-5"><span className="text-sm font-semibold text-[#25806a]">0{index + 1}</span><h2 className="mt-3 font-semibold text-[#24473d]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#6a8078]">{text}</p></div>)}</section>
        <section ref={upload} id="sutartis" className="scroll-mt-8 rounded-3xl bg-white p-6 pb-10 shadow-sm ring-1 ring-[#e1e8e3] sm:p-9"><p className="text-sm font-semibold text-[#23715d]">{selected ? selected.toUpperCase() : "KITAS ŽINGSNIS"}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#173b32]">Įkelkite paramos sutartį</h2><p className="mt-3 max-w-2xl leading-7 text-[#627971]">AI suras svarbiausius terminus ir įsipareigojimus. Prieš išsaugant viską galėsite patikrinti bei pataisyti.</p><div className="mt-7"><DocumentUpload programs={programs} /></div></section>
      </div>
    </main>
  );
}
