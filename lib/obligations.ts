import type { Condition, Obligation, Program, UserInputs } from "./types";

/** From this grant amount (EUR) the "bigGrant" condition applies (e.g. a permanent plaque). */
export const BIG_GRANT_EUR = 500000;

/** Adds months to a YYYY-MM-DD date in UTC, clamping to month end (31 Jan + 1 = 28/29 Feb). */
export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export function computeObligations(program: Program, inputs: UserInputs): Obligation[] {
  const applies: Record<Condition, boolean> = {
    isSme: inputs.isSme,
    boughtEquipment: inputs.boughtEquipment,
    boughtRealEstate: inputs.boughtRealEstate,
    boughtIntangible: inputs.boughtIntangible,
    generatesRevenue: inputs.generatesRevenue,
    vatEligible: inputs.vatEligible,
    contractingAuthority: inputs.contractingAuthority,
    notSme: !inputs.isSme,
    hasJobs: inputs.promisedJobs > 0,
    bigGrant: inputs.grantAmount >= BIG_GRANT_EUR,
  };
  return program.obligations
    .filter((t) => !t.condition || Boolean(applies[t.condition]))
    .map((t) => {
      const base = t.fixedDate || (t.startsFrom === "contract_signed" ? inputs.contractSignedDate : inputs.projectEndDate);
      const offset = t.fixedDate ? 0 : t.offsetMonths;
      const count = t.recurring === "yearly" ? (t.recurringYears ?? 5) : 1;
      const dates = Array.from({ length: count }, (_, i) => addMonths(base, offset + i * 12));
      return { ...t, dueDate: dates[0], dates };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
