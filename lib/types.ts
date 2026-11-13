export type Risk = "high" | "medium" | "low";

/** Yes/no facts about the user's project that decide which obligations apply. */
export type Flag =
  | "isSme"
  | "boughtEquipment"
  | "boughtRealEstate"
  | "boughtIntangible"
  | "generatesRevenue"
  | "vatEligible"
  | "contractingAuthority";

/** Flags plus values derived from other inputs (see computeObligations). */
export type Condition = Flag | "notSme" | "hasJobs" | "bigGrant";

export type ObligationTemplate = {
  id: string;
  title: string;
  plainExplanation: string;
  startsFrom: "contract_signed" | "project_end";
  offsetMonths: number;
  /** Exact due date YYYY-MM-DD from the user's contract/goal. When set, startsFrom + offsetMonths are ignored. */
  fixedDate?: string;
  recurring: "none" | "yearly";
  /** Number of yearly occurrences when recurring is "yearly". Default 5. */
  recurringYears?: number;
  /** Obligation applies only when this is true for the user. Omit = always applies. */
  condition?: Condition;
  risk: Risk;
  consequence: string;
  source: { document: string; page: number; clause: string };
  evidence: string[];
};

export type Program = {
  id: string;
  name: string;
  agency: string;
  sourceDocUrl: string;
  obligations: ObligationTemplate[];
  glossary?: GlossaryTerm[];
};

/** Hard term explained simply. `forms` = word stems to highlight, e.g. "perkanči organizacij" (word endings vary). */
export type GlossaryTerm = { term: string; forms: string[]; explanation: string; page: number };

export type UserInputs = {
  programId: string;
  contractSignedDate: string; // YYYY-MM-DD
  projectEndDate: string; // YYYY-MM-DD
  grantAmount: number;
  promisedJobs: number;
} & Record<Flag, boolean>;

export type Obligation = ObligationTemplate & {
  /** First due date, YYYY-MM-DD. */
  dueDate: string;
  /** All due dates (one for non-recurring). */
  dates: string[];
};

export type AskResponse = {
  answer: string;
  sources: { obligationId: string; document: string; page: number; clause: string }[];
};
