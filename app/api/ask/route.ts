import Anthropic from "@anthropic-ai/sdk";
import { getProgram } from "@/lib/programs";
import type { AskResponse, ObligationTemplate, Program } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const programId = body?.programId;
  const question = body?.question;
  if (typeof programId !== "string" || typeof question !== "string" || !question.trim() || question.length > 2000) {
    return Response.json({ error: "Įrašykite klausimą (iki 2000 simbolių)." }, { status: 400 });
  }
  // Programs from an uploaded document live only in the user's browser, so they come in the body.
  const sent = body?.program;
  const program: Program | undefined =
    getProgram(programId) ?? (typeof sent?.name === "string" && Array.isArray(sent?.obligations) ? sent : undefined);
  if (!program) return Response.json({ error: "Programa nerasta. Įkelkite dokumentą iš naujo." }, { status: 404 });

  // `dates` comes only from the browser (computed obligations); /data templates have none.
  const rules = program.obligations.map(({ id, title, plainExplanation, consequence, source, dates }: ObligationTemplate & { dates?: string[] }) =>
    ({ id, title, plainExplanation, consequence, source, dates }));
  const rulesJson = JSON.stringify(rules);
  if (rulesJson.length > 100_000) return Response.json({ error: "Per daug duomenų klausimui." }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);
  try {
    // Sonnet 5.5 at low effort: the rules are already extracted, so this is short Q&A over a small JSON.
    const res = await client.beta.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      system: "Tu esi ES/valstybės paramos gavėjų patarėjas. Atsakyk lietuviškai, trumpai ir aiškiai, remdamasis TIK pateiktomis programos taisyklėmis. Jei taisyklėse atsakymo nėra, taip ir pasakyk ir patark kreiptis į paramą skyrusią instituciją. Nurodyk taisyklių id, kuriomis rėmeisi. Jei taisyklė turi dates (šio projekto terminai YYYY-MM-DD), atsakyme nurodyk konkrečią datą ir palygink ją su šiandienos data.",
      messages: [{ role: "user", content: `Šiandien: ${today}\nPrograma: ${program.name} (${program.agency})\nTaisyklės (JSON):\n${rulesJson}\n\nKlausimas: ${question}` }],
    });
    const text = res.content.find((b) => b.type === "text")?.text;
    if (res.stop_reason !== "end_turn" || !text) return Response.json({ error: "Nepavyko gauti atsakymo. Bandykite dar kartą." }, { status: 502 });
    const x = JSON.parse(text) as { answer: string; ruleIds: string[] };
    // Only cite sources that really exist in the program data.
    const response: AskResponse = {
      answer: x.answer,
      sources: program.obligations.filter((o) => x.ruleIds.includes(o.id)).map((o) => ({ obligationId: o.id, ...o.source })),
    };
    return Response.json(response);
  } catch (e) {
    console.error("ask failed", e);
    return Response.json({ error: "Nepavyko gauti atsakymo. Bandykite dar kartą." }, { status: 502 });
  }
}

const client = new Anthropic();
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "ruleIds"],
  properties: {
    answer: { type: "string", description: "Atsakymas lietuviškai" },
    ruleIds: { type: "array", items: { type: "string" }, description: "Taisyklių id, kuriomis remtasi" },
  },
};
