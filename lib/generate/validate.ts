import { findBiasHits, findFullNameHits } from "./bias-lexicon";
import { isEventTypeLeaf } from "./event-type-leaves";
import type { FactBundle, GeneratedNewsEvent } from "./schema";
import { generatedNewsEventSchema } from "./schema";

export type ValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  event: GeneratedNewsEvent | null;
};

function stripTags(html: string): string {
  return html
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeQuote(s: string): string {
  return s
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

export function jaccard(a: string, b: string): number {
  const A = tokens(a);
  const B = tokens(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

export function validateGeneratedEvent(
  raw: unknown,
  bundle: FactBundle,
  options?: {
    requireHubTopic?: string;
    seedTitleMatches?: { title: string; occurred_at: string }[];
  },
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const parsed = generatedNewsEventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: [
        {
          severity: "error",
          code: "schema",
          message: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
      ],
      warnings: [],
      event: null,
    };
  }

  const event = parsed.data;
  const hub = options?.requireHubTopic ?? "elon-musk";
  if (!event.topic_slugs.includes(hub)) {
    errors.push({
      severity: "error",
      code: "missing_hub_topic",
      message: `topic_slugs must include "${hub}"`,
    });
  }

  if (!isEventTypeLeaf(event.event_type_slug)) {
    errors.push({
      severity: "error",
      code: "unknown_event_type",
      message: `event_type_slug "${event.event_type_slug}" is not a hierarchy leaf`,
    });
  }

  if (event.sources.length === 0) {
    errors.push({
      severity: "error",
      code: "no_sources",
      message: "At least one source is required",
    });
  }

  const hasPrimary = event.sources.some((s) => s.type === "primary");
  if (!hasPrimary) {
    warnings.push({
      severity: "warning",
      code: "no_primary_source",
      message: "No source marked type=primary",
    });
  }

  if (
    event.sources.length < 2 &&
    !event.sources.some(
      (s) =>
        s.type === "primary" &&
        /x\.com|twitter\.com|tesla\.com|spacex\.com|sec\.gov|edgars/i.test(
          s.url,
        ),
    )
  ) {
    warnings.push({
      severity: "warning",
      code: "single_source",
      message:
        "Only one source and it is not an obvious primary (X/company/SEC)",
    });
  }

  const plain = stripTags(event.summary_html);
  const biasHits = findBiasHits(plain);
  if (biasHits.length) {
    errors.push({
      severity: "error",
      code: "bias_lexicon",
      message: `Loaded language in narrator text: ${biasHits.join(", ")}`,
    });
  }

  const fullNameHits = findFullNameHits(`${event.title}\n${plain}`);
  if (fullNameHits.length) {
    errors.push({
      severity: "error",
      code: "full_name",
      message: `Use short names in title/body (not full personal names): ${fullNameHits.join(", ")}`,
    });
  }

  const quoteBlob = normalizeQuote(
    [
      ...bundle.subject_quotes.map((q) => q.text),
      ...bundle.facts,
      bundle.notes ?? "",
    ].join(" "),
  );

  for (const q of event.quotes) {
    const nq = normalizeQuote(q.text);
    if (nq.length < 8) {
      warnings.push({
        severity: "warning",
        code: "short_quote",
        message: `Very short quote: "${q.text}"`,
      });
      continue;
    }
    // allow if quote is substring of fact bundle material (fuzzy)
    if (!quoteBlob.includes(nq) && jaccard(nq, quoteBlob) < 0.45) {
      // also check word-window containment
      const words = nq.split(" ").filter(Boolean);
      const significant = words.filter((w) => w.length > 3);
      const hitRatio =
        significant.length === 0
          ? 0
          : significant.filter((w) => quoteBlob.includes(w)).length /
            significant.length;
      if (hitRatio < 0.7) {
        errors.push({
          severity: "error",
          code: "quote_integrity",
          message: `Quote not grounded in fact/quote inputs: "${q.text.slice(0, 80)}…"`,
        });
      }
    }
  }

  // Length soft bounds
  if (plain.length < 40) {
    warnings.push({
      severity: "warning",
      code: "body_short",
      message: `Body very short (${plain.length} chars)`,
    });
  }
  if (plain.length > 1600) {
    warnings.push({
      severity: "warning",
      code: "body_long",
      message: `Body long for Newslines (${plain.length} chars)`,
    });
  }

  // Headline clone soft check
  for (const h of bundle.publisher_headlines) {
    if (jaccard(event.title, h) > 0.85) {
      warnings.push({
        severity: "warning",
        code: "headline_clone",
        message: `Title very similar to publisher headline: "${h}"`,
      });
    }
  }

  // Date sanity
  const d = Date.parse(event.occurred_at);
  if (Number.isNaN(d)) {
    errors.push({
      severity: "error",
      code: "bad_date",
      message: `occurred_at not parseable: ${event.occurred_at}`,
    });
  } else if (d > Date.now() + 86_400_000) {
    errors.push({
      severity: "error",
      code: "future_date",
      message: "occurred_at is in the future",
    });
  }

  // Soft past-tense heuristic on first sentence
  const firstSentence = plain.split(/(?<=[.!?])\s+/)[0] || plain;
  if (
    /\b(announced|filed|said|posted|won|lost|hired|fired|released)\b/i.test(
      firstSentence,
    ) &&
    !/\b(after|before|when|since)\b/i.test(firstSentence)
  ) {
    warnings.push({
      severity: "warning",
      code: "past_tense",
      message: "Lead may use past-tense event verbs; prefer present for Newslines",
    });
  }

  // HTML junk
  if (/<script|twitter-tweet|widgets\.js/i.test(event.summary_html)) {
    errors.push({
      severity: "error",
      code: "html_junk",
      message: "summary_html contains scripts or Twitter widgets",
    });
  }

  // Seed near-dupes
  if (options?.seedTitleMatches?.length) {
    for (const existing of options.seedTitleMatches) {
      const sim = jaccard(event.title, existing.title);
      if (sim >= 0.72) {
        const t0 = Date.parse(event.occurred_at);
        const t1 = Date.parse(existing.occurred_at);
        const closeDate =
          !Number.isNaN(t0) &&
          !Number.isNaN(t1) &&
          Math.abs(t0 - t1) < 14 * 86_400_000;
        if (closeDate || sim >= 0.9) {
          warnings.push({
            severity: "warning",
            code: "seed_near_dupe",
            message: `Similar seed title (${sim.toFixed(2)}): "${existing.title}" @ ${existing.occurred_at}`,
          });
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    event,
  };
}

/** Map generated event to seed scalars for optional later import. */
export function toSeedScalars(event: GeneratedNewsEvent): {
  source_url: string | null;
  media_url: string | null;
  quotes: { text: string; speaker: string | null }[];
} {
  const primary =
    event.sources.find((s) => s.type === "primary") ?? event.sources[0];
  const media =
    event.media.find((m) => m.kind === "youtube" || m.kind === "image") ??
    event.media[0];
  return {
    source_url: primary?.url ?? null,
    media_url: media?.url ?? null,
    quotes: event.quotes.map((q) => ({
      text: q.text,
      speaker: q.speaker,
    })),
  };
}
