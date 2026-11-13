<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Paramos Sargas

Hackathon project (4 days, team of 3, one repo). Deployed on Vercel.

## Product
Lithuanian businesses that received EU/state grants often lose funding because they miss obligations: reporting deadlines, keeping equipment for 5 years, keeping created jobs, publicity rules. The user does NOT upload documents. They pick their grant program and enter 5 fields (contract signed date, project end date, grant amount, promised jobs, bought equipment). The app shows:
- their obligations on a timeline with deadlines and a risk level
- a plain-language explanation, the consequence and a source citation per obligation
- an evidence checklist per obligation (state saved in localStorage)
- an "Ar galiu…?" ("Can I…?") box answered by Claude with citations
- email reminders

**All UI text is in Lithuanian.**

## Stack
Next.js 16 App Router, React 19, TypeScript, Tailwind 4. Claude API (`ANTHROPIC_API_KEY`) and Resend (`RESEND_API_KEY`); see `.env.example`, put real keys in `.env.local` (gitignored) and in Vercel env settings.

## Folder structure and owners
| Path | What | Owner |
|---|---|---|
| `data/programs/*.json` | One JSON file per grant program | data |
| `lib/programs.ts` | Registry: imports every program JSON. Add one line per new file | data |
| `lib/types.ts` | Shared types. Change only after telling the team | shared |
| `lib/obligations.ts` | Pure function `computeObligations(program, inputs)` → obligations with dates, sorted | shared |
| `lib/obligations.check.ts` | Self-check, run `node lib/obligations.check.ts` after changing obligations.ts | shared |
| `app/page.tsx` | Step 1: program + 5 inputs form | frontend |
| `app/rezultatai/page.tsx` | Step 2: timeline + checklist + ask box. Inputs come from the URL query | frontend |
| `components/` | ProgramForm, Timeline, ObligationCard, EvidenceChecklist, AskBox | frontend |
| `app/api/ask/route.ts` | POST `{programId, question}` → `{answer, sources}` (Claude) | backend |
| `app/api/remind/route.ts` | POST `{email, obligationId}` → `{ok}` (Resend) | backend |

## Data schema (see `lib/types.ts`)
```ts
Program { id, name, agency, sourceDocUrl, obligations: ObligationTemplate[] }
ObligationTemplate {
  id, title, plainExplanation,
  startsFrom: "contract_signed" | "project_end",
  offsetMonths: number,              // due date = startsFrom date + offsetMonths
  recurring: "none" | "yearly",
  recurringYears?: number,           // yearly occurrences, default 5
  condition?: "boughtEquipment" | "hasJobs", // omit = always applies; hasJobs = promisedJobs > 0
  risk: "high" | "medium" | "low",
  consequence,
  source: { document, page, clause },
  evidence: string[]
}
UserInputs { programId, contractSignedDate, projectEndDate, grantAmount, promisedJobs, boughtEquipment }
Obligation = ObligationTemplate & { dueDate, dates: string[] }  // dates are YYYY-MM-DD
```
`data/programs/demo-program.json` is PLACEHOLDER data (see its `_placeholder` field); replace it with real programs.

## Hard scope limits
- No auth, no database, no payments, no file uploads, no user accounts.
- Program data lives only in JSON files in `/data`.
- Checklist state lives in localStorage; always wrap access in try/catch.
- No UI libraries; Tailwind only. Don't add dependencies without asking the team.

## Team rule
**Keep changes small and inside your own folder; do not refactor other people's code.** Changing `lib/types.ts` or `lib/obligations.ts` affects everyone: tell the team first and run the self-check and `npm run build`.
