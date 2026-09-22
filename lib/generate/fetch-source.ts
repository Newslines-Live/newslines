import type { FactBundle } from "./schema";
import { chatCompletion, parseJsonFromLlm } from "./llm";
import { buildFactExtractPrompt } from "./prompts";

const UA =
  "NewslinesPilot/0.1 (+local research; respect robots; contact: local)";

/** Strip tags to plain text (rough). */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function isLikelyXUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return h === "x.com" || h === "twitter.com" || h === "mobile.twitter.com";
  } catch {
    return false;
  }
}

export async function fetchSourceText(
  url: string,
): Promise<{ ok: boolean; text: string; title?: string; error?: string }> {
  if (isLikelyXUrl(url)) {
    return {
      ok: false,
      text: "",
      error:
        "X/Twitter pages usually require login. Pass --text-file or case.pasted_text.",
    };
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return { ok: false, text: "", error: `HTTP ${res.status}` };
    }
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch
      ? htmlToText(titleMatch[1]).slice(0, 300)
      : undefined;
    const text = htmlToText(html).slice(0, 20_000);
    if (text.length < 40) {
      return {
        ok: false,
        text,
        title,
        error: "Fetched page had little readable text",
      };
    }
    return { ok: true, text, title };
  } catch (e) {
    return {
      ok: false,
      text: "",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

type ExtractedPartial = {
  facts?: string[];
  subject_quotes?: { text: string; speaker: string; source_url?: string }[];
  publisher_headlines?: string[];
  suggested_occurred_at?: string | null;
  suggested_date_precision?: "exact" | "month" | "year" | null;
};

/**
 * Build fact bundle from case facts and/or LLM extract of pasted/fetched text.
 */
export async function buildFactBundle(input: {
  urls: string[];
  pastedText?: string;
  preFacts?: string[];
  preQuotes?: { text: string; speaker: string; source_url?: string }[];
  suggested_occurred_at?: string;
  suggested_date_precision?: "exact" | "month" | "year";
  suggested_event_type_slug?: string;
  notes?: string;
  skipLlmExtract?: boolean;
}): Promise<{
  bundle: FactBundle;
  fetchErrors: { url: string; error: string }[];
  usedLlmExtract: boolean;
}> {
  const fetchErrors: { url: string; error: string }[] = [];
  const texts: { url?: string; text: string }[] = [];
  const headlines: string[] = [];

  if (input.pastedText?.trim()) {
    texts.push({ text: input.pastedText.trim() });
  }

  for (const url of input.urls) {
    const result = await fetchSourceText(url);
    if (result.ok) {
      texts.push({ url, text: result.text });
      if (result.title) headlines.push(result.title);
    } else {
      fetchErrors.push({
        url,
        error: result.error || "fetch failed",
      });
    }
  }

  let facts = [...(input.preFacts ?? [])];
  let quotes = [...(input.preQuotes ?? [])];
  let usedLlmExtract = false;
  let suggested_occurred_at = input.suggested_occurred_at;
  let suggested_date_precision = input.suggested_date_precision;

  if (
    !input.skipLlmExtract &&
    texts.length > 0 &&
    facts.length === 0
  ) {
    const { content } = await chatCompletion(
      [
        {
          role: "system",
          content:
            "You extract neutral atomic facts and newsmaker quotes. JSON only.",
        },
        { role: "user", content: buildFactExtractPrompt(texts) },
      ],
      { temperature: 0.1 },
    );
    const parsed = parseJsonFromLlm(content) as ExtractedPartial;
    usedLlmExtract = true;
    if (parsed.facts?.length) facts = parsed.facts;
    if (parsed.subject_quotes?.length) {
      quotes = parsed.subject_quotes.map((q) => ({
        text: q.text,
        speaker: q.speaker,
        source_url: q.source_url,
      }));
    }
    if (parsed.publisher_headlines?.length) {
      headlines.push(...parsed.publisher_headlines);
    }
    if (parsed.suggested_occurred_at && !suggested_occurred_at) {
      suggested_occurred_at = parsed.suggested_occurred_at;
    }
    if (parsed.suggested_date_precision && !suggested_date_precision) {
      suggested_date_precision = parsed.suggested_date_precision;
    }
  }

  // Fallback: treat pasted text lines as facts if still empty
  if (facts.length === 0 && input.pastedText?.trim()) {
    facts = input.pastedText
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 10)
      .slice(0, 12);
  }

  if (facts.length === 0) {
    throw new Error(
      `No facts available. Provide case.facts, --facts-file, or pasted_text/fetchable URLs. Fetch errors: ${JSON.stringify(fetchErrors)}`,
    );
  }

  const bundle: FactBundle = {
    facts,
    subject_quotes: quotes,
    source_urls: input.urls,
    publisher_headlines: [...new Set(headlines)],
    suggested_occurred_at,
    suggested_date_precision,
    suggested_event_type_slug: input.suggested_event_type_slug,
    notes: input.notes,
  };

  return { bundle, fetchErrors, usedLlmExtract };
}
