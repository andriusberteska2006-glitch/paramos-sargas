// Self-check for computeObligations. Run: node lib/obligations.check.ts
import assert from "node:assert/strict";
import { addMonths, computeObligations } from "./obligations.ts";
import type { ObligationTemplate, Program } from "./types.ts";

const tpl = (o: Partial<ObligationTemplate>): ObligationTemplate => ({
  id: "x", title: "", plainExplanation: "", startsFrom: "project_end", offsetMonths: 0,
  recurring: "none", risk: "low", consequence: "", source: { document: "", page: 1, clause: "" }, evidence: [],
  ...o,
});

assert.equal(addMonths("2025-01-31", 1), "2025-02-28");
assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
assert.equal(addMonths("2025-03-15", 60), "2030-03-15");
assert.equal(addMonths("2025-11-30", 3), "2026-02-28");

const program: Program = {
  id: "p", name: "", agency: "", sourceDocUrl: "",
  obligations: [
    tpl({ id: "late", offsetMonths: 24 }),
    tpl({ id: "early", startsFrom: "contract_signed", offsetMonths: 0 }),
    tpl({ id: "equip", condition: "boughtEquipment", offsetMonths: 60 }),
    tpl({ id: "jobs", condition: "hasJobs", offsetMonths: 12, recurring: "yearly", recurringYears: 3 }),
  ],
};
const base = {
  programId: "p", contractSignedDate: "2024-05-10", projectEndDate: "2026-06-30", grantAmount: 1,
  isSme: true, boughtRealEstate: false, boughtIntangible: false, generatesRevenue: false, vatEligible: false, contractingAuthority: false,
};

const all = computeObligations(program, { ...base, promisedJobs: 2, boughtEquipment: true });
assert.deepEqual(all.map((o) => o.id), ["early", "jobs", "late", "equip"]);
assert.deepEqual(all.find((o) => o.id === "jobs")!.dates, ["2027-06-30", "2028-06-30", "2029-06-30"]);
assert.equal(all[0].dueDate, "2024-05-10");

const none = computeObligations(program, { ...base, promisedJobs: 0, boughtEquipment: false });
assert.deepEqual(none.map((o) => o.id), ["early", "late"]);

// Derived conditions: notSme and bigGrant.
const derived: Program = { ...program, obligations: [tpl({ id: "large", condition: "notSme" }), tpl({ id: "plaque", condition: "bigGrant" })] };
const ids = (i: Partial<typeof base>) => computeObligations(derived, { ...base, promisedJobs: 0, boughtEquipment: false, ...i }).map((o) => o.id);
assert.deepEqual(ids({}), []);
assert.deepEqual(ids({ isSme: false, grantAmount: 500000 }), ["large", "plaque"]);

// fixedDate overrides startsFrom + offsetMonths, and yearly repeats from it.
const fixed: Program = { ...program, obligations: [tpl({ id: "goal", fixedDate: "2027-03-31", offsetMonths: 99, recurring: "yearly", recurringYears: 2 })] };
assert.deepEqual(computeObligations(fixed, { ...base, promisedJobs: 0, boughtEquipment: false })[0].dates, ["2027-03-31", "2028-03-31"]);

console.log("obligations.check: OK");
