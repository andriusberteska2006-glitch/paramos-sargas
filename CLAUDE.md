<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Paramos Sargas

Hackathon project (4 days, team of 3, one repo). Deployed on Vercel.

## Product
Lithuanian businesses that received EU/state grants often lose funding because they miss obligations: reporting deadlines, keeping equipment for 5 years, keeping created jobs, publicity rules. The user uploads their grant contract (PDF/JPG/PNG); Claude extracts the program, dates, amount, jobs, equipment and all obligations; the user reviews and corrects them (saved in localStorage, nothing on the server). Manual fallback: pick a program from /data; its rules open in the same editor, where the user adds their own goals with exact deadlines. The app shows:
- their obligations on a timeline with deadlines and a risk level
- a plain-language explanation, the consequence and a source citation per obligation
- an evidence checklist per obligation (state saved in localStorage); each item can get a proof file + comment, all proofs listed in the vault `/saugykla`
- an "Ar galiu…?" ("Can I…?") box answered by Claude with citations
- email reminders

**All UI text is in Lithuanian.**

## Stack
Next.js 16 App Router, React 19, TypeScript, Tailwind 4. Claude API (`ANTHROPIC_API_KEY`) and Resend (`RESEND_API_KEY`); email reminders also use Upstash Redis over REST (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) and a daily Vercel Cron (`vercel.json`, `CRON_SECRET`); see `.env.example`, put real keys in `.env.local` (gitignored) and in Vercel env settings.

## Folder structure and owners
| Path | What | Owner |
|---|---|---|
| `data/programs/*.json` | One JSON file per grant program | data |
| `lib/programs.ts` | Registry: imports every program JSON. Add one line per new file | data |
| `lib/types.ts` | Shared types. Change only after telling the team | shared |
| `lib/flags.ts` | Lithuanian labels for the yes/no fields (used by forms and the extraction prompt) | shared |
| `lib/obligations.ts` | Pure function `computeObligations(program, inputs)` → obligations with dates, sorted | shared |
| `lib/obligations.check.ts` | Self-check, run `node lib/obligations.check.ts` after changing obligations.ts | shared |
| `lib/proofs.ts` | IndexedDB store for checklist proof files (`listProofs`, `saveProof`, `deleteProof`) | frontend |
| `app/saugykla/page.tsx` | Proof vault: every uploaded proof with date, obligation, item, comment, file (`ProofVault`) | frontend |
| `app/page.tsx` | Step 1: document upload or manual start (pick program) → same review/edit form (`DocumentUpload`) | frontend |
| `app/rezultatai/page.tsx` | Step 2: timeline + checklist + ask box. Inputs come from the URL query | frontend |
| `components/` | DocumentUpload, UploadedResults, Timeline, ObligationCard, EvidenceChecklist, ProofVault, FileThumb, ReminderForm, AskBox | frontend |
| `app/api/ask/route.ts` | POST `{programId, question}` → `{answer, sources}` (Claude) | backend |
| `app/api/remind/route.ts` | POST `{email, programName, deadlines: [{title, date}]}` → `{ok}`: confirmation email now, reminders 30 and 7 days before each deadline stored in Redis | backend |
| `app/api/remind/atsisakyti/route.ts` | Unsubscribe link from every email (GET page with button, POST removes); also Gmail one-click | backend |
| `app/api/cron/priminimai/route.ts` | Daily cron: sends due reminders, one email per address | backend |
| `lib/reminders.ts` | Server-only: Redis REST call, Resend send, unsubscribe token, `reminderEntries`. Self-check: `node lib/reminders.check.ts` | backend |
| `app/api/extract/route.ts` | POST multipart `file` → `{program, inputs}` extracted by Claude (nothing stored) | backend |

## Data schema (see `lib/types.ts`)
```ts
Program { id, name, agency, sourceDocUrl, obligations: ObligationTemplate[] }
ObligationTemplate {
  id, title, plainExplanation,
  startsFrom: "contract_signed" | "project_end",
  offsetMonths: number,              // due date = startsFrom date + offsetMonths
  fixedDate?: string,                // exact YYYY-MM-DD deadline; overrides startsFrom + offsetMonths
  recurring: "none" | "yearly",
  recurringYears?: number,           // yearly occurrences, default 5
  condition?: Condition,             // omit = always applies. A Flag, or derived: notSme, hasJobs (promisedJobs > 0), bigGrant (grantAmount >= 500000)
  risk: "high" | "medium" | "low",
  consequence,
  source: { document, page, clause },
  evidence: string[]
}
Flag = isSme | boughtEquipment | boughtRealEstate | boughtIntangible | generatesRevenue | vatEligible | contractingAuthority  // labels in lib/flags.ts
UserInputs { programId, contractSignedDate, projectEndDate, grantAmount, promisedJobs } & Record<Flag, boolean>
Obligation = ObligationTemplate & { dueDate, dates: string[] }  // dates are YYYY-MM-DD
```
`data/programs/demo-program.json` is PLACEHOLDER data (see its `_placeholder` field); replace it with real programs.

## Hard scope limits
- No auth, no database, no payments, no file storage (uploads go only to Claude for extraction), no user accounts.
  - Only exception: Upstash Redis holds email reminders (email, program name, deadline title + date) so the daily cron can send them. Nothing else goes there.
- Program data lives only in JSON files in `/data`.
- Checklist state lives in localStorage; always wrap access in try/catch.
- Proof files live in IndexedDB (browser only, never sent to a server), see `lib/proofs.ts`.
- No UI libraries; Tailwind only. Don't add dependencies without asking the team.

## Team rule
**Keep changes small and inside your own folder; do not refactor other people's code.** Changing `lib/types.ts` or `lib/obligations.ts` affects everyone: tell the team first and run the self-check and `npm run build`.

## Git workflow (GitHub: andriusberteska2006-glitch/paramos-sargas, private)
- Never commit to `main`. Start every feature from fresh main: `git checkout main && git pull && git checkout -b <name>/<feature>` (e.g. `andrius/priminimai`).
- One branch = one feature, merged within hours, not days. Touch only that feature's files. Shared files (`lib/types.ts`, `lib/obligations.ts`, `package.json`, `CLAUDE.md`) only after telling the team.
- Before pushing: `git merge main`, fix conflicts locally, `npm run build` must pass (plus the self-checks if you touched those files).
- `git push -u origin <branch>`, open a Pull Request on GitHub, merge it there, delete the branch.
- Never commit `.env.local` or any key.
