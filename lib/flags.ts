import type { Condition, Flag } from "./types";

/** Yes/no questions that decide which obligations apply (forms + AI extraction prompt). */
export const FLAG_LABELS: Record<Flag, string> = {
  isSme: "Įmonė yra labai maža, maža arba vidutinė (SVV)",
  boughtEquipment: "Už paramą įsigyjama įranga ar kitas ilgalaikis materialusis turtas",
  boughtRealEstate: "Projekte yra statyba, rekonstrukcija ar nekilnojamojo turto pirkimas",
  boughtIntangible: "Įsigyjamas nematerialusis turtas (programinė įranga, licencijos, patentai)",
  generatesRevenue: "Projektas uždirbs pajamų (pvz. iš paslaugų ar produktų, sukurtų už paramą)",
  vatEligible: "PVM įtrauktas į tinkamas finansuoti išlaidas",
  contractingAuthority: "Esate perkančioji organizacija (taikomas Viešųjų pirkimų įstatymas)",
};

export const FLAGS = Object.keys(FLAG_LABELS) as Flag[];

/** Short text for "applies only if …" in the review form. */
export const CONDITION_LABELS: Record<Condition, string> = {
  isSme: "įmonė yra SVV",
  notSme: "įmonė nėra SVV",
  boughtEquipment: "perkama įranga",
  boughtRealEstate: "yra statyba / nekilnojamasis turtas",
  boughtIntangible: "perkamas nematerialusis turtas",
  generatesRevenue: "projektas uždirba pajamų",
  vatEligible: "PVM yra tinkama išlaida",
  contractingAuthority: "esate perkančioji organizacija",
  hasJobs: "kuriamos darbo vietos",
  bigGrant: "parama ≥ 500 000 EUR",
};
