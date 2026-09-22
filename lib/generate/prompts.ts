import type { FactBundle, GeneratedNewsEvent } from "./schema";
import { formatEventTypeListForPrompt } from "./event-type-leaves";
import { BIAS_LEXICON } from "./bias-lexicon";
import goldExamples from "../../content/pilot-musk/gold/few-shots.json";

export function buildSystemPrompt(): string {
  return `You write Newslines events: short, original, present-tense, factual timeline notes.

HARD RULES:
1. Output ONLY valid JSON matching the schema. No markdown fences, no preamble.
2. Use ONLY the facts and subject quotes provided. Do not invent dates, names, numbers, or quotes.
3. Write ORIGINAL prose. Do not paraphrase one article's lede or unique phrasing. Do not copy publisher headlines as the title.
4. Present tense for the event itself ("announces", "files", "posts"). Past tense only for background context.
5. SHORT NAMES in title and summary_html: use surname or familiar short form only (Musk, Trump, Tesla, SpaceX) — never "Elon Musk", "Donald Trump", or similar full personal names in headline or body prose. Speakers in quotes[] may use full name for attribution metadata only.
6. One event only. Neutral narrator voice — no loaded language: ${BIAS_LEXICON.slice(0, 20).join(", ")}, …
7. Quotes: only text present in subject_quotes. Set speaker accurately. Also include as <blockquote> in summary_html when used.
8. summary_html: 1–4 short paragraphs. **Include every material fact** from the fact list (who/what/when/where, vehicle IDs, numbers, outcomes, orders). Do not invent, but do not drop load-bearing detail just to stay short. Prefer linking the key verb to a primary source with <a href="URL">verb</a>. No scripts. No Twitter widget HTML. Introduce quotes as "Musk writes:" / "Musk posts:" not full names.
9. occurred_at: the date the event HAPPENED (ISO 8601), not article publication date unless the news IS a publication. Use date_precision exact|month|year honestly.
10. event_type_slug: exactly one leaf from the list below.
11. topic_slugs: include "elon-musk" first when this is a Musk pilot event; add other relevant topic slugs (kebab-case). Prefer known: elon-musk, tesla-inc, spacex, twitter, starship-rocket, neuralink, the-boring-company.
12. sources[]: every URL used; type primary|corroboration|context. Prefer primary first.
13. media[]: X post / YouTube / document URLs when they SUPPORT the event.
14. confidence: high if well grounded; medium if sparse; low if conflicting or thin.

EVENT TYPE LEAVES (pick one slug):
${formatEventTypeListForPrompt()}

JSON SCHEMA shape:
{
  "title": string,
  "summary_html": string,
  "occurred_at": string,
  "date_precision": "exact"|"month"|"year",
  "event_type_slug": string,
  "topic_slugs": string[],
  "quotes": [{"text": string, "speaker": string, "source_url"?: string}],
  "sources": [{"url": string, "title"?: string, "publisher"?: string, "type": "primary"|"corroboration"|"context"}],
  "media": [{"url": string, "kind": "x_post"|"youtube"|"video"|"image"|"audio"|"document", "caption"?: string, "author"?: string}],
  "confidence": "high"|"medium"|"low"
}

Omit provenance — the tooling adds it.`;
}

export function buildUserPrompt(bundle: FactBundle): string {
  const fewShot = (goldExamples as GeneratedNewsEvent[]).slice(0, 3);
  return `FACT BUNDLE (authoritative — do not go beyond this):

facts:
${bundle.facts.map((f, i) => `${i + 1}. ${f}`).join("\n")}

subject_quotes:
${
  bundle.subject_quotes.length
    ? bundle.subject_quotes
        .map(
          (q) =>
            `- "${q.text}" — ${q.speaker}${q.source_url ? ` (${q.source_url})` : ""}`,
        )
        .join("\n")
    : "(none)"
}

source_urls: ${JSON.stringify(bundle.source_urls)}
publisher_headlines (do NOT copy as title): ${JSON.stringify(bundle.publisher_headlines)}
suggested_occurred_at: ${bundle.suggested_occurred_at ?? "(infer from facts if clear)"}
suggested_date_precision: ${bundle.suggested_date_precision ?? "(infer)"}
suggested_event_type_slug: ${bundle.suggested_event_type_slug ?? "(pick best leaf)"}
notes: ${bundle.notes ?? ""}

EXAMPLE OUTPUTS (style only — not facts for this event):
${JSON.stringify(fewShot, null, 2)}

Write one new event JSON now.`;
}

export function buildFactExtractPrompt(
  texts: { url?: string; text: string }[],
): string {
  return `Extract a structured fact list from the source material for a Newslines timeline event.

Return JSON only:
{
  "facts": string[],  // atomic who/what/when/where facts, neutral wording, no article phrases
  "subject_quotes": [{"text": string, "speaker": string}],  // only NEWSmakers' verbatim quotes found in text
  "publisher_headlines": string[],
  "suggested_occurred_at": string | null,  // ISO when event happened if known
  "suggested_date_precision": "exact"|"month"|"year"|null
}

Rules:
- Prefer bare facts over commentary.
- Do not invent.
- Do not include journalist analysis as facts.
- Quotes only if clearly spoken/written by a named person in the text.

SOURCES:
${texts
  .map(
    (t, i) =>
      `--- SOURCE ${i + 1}${t.url ? ` ${t.url}` : ""} ---\n${t.text.slice(0, 12000)}`,
  )
  .join("\n\n")}`;
}
