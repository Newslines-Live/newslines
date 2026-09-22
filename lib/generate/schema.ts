import { z } from "zod";

export const datePrecisionSchema = z.enum(["exact", "month", "year"]);

export const eventSourceSchema = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
  publisher: z.string().optional(),
  type: z.enum(["primary", "corroboration", "context"]),
  accessed_at: z.string().optional(),
});

export const eventMediaSchema = z.object({
  url: z.string().min(1),
  kind: z.enum([
    "x_post",
    "youtube",
    "video",
    "image",
    "audio",
    "document",
  ]),
  caption: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
});

export const eventQuoteSchema = z.object({
  text: z.string().min(1),
  speaker: z.string().min(1),
  source_url: z.string().optional(),
});

export const generatedNewsEventSchema = z.object({
  title: z.string().min(1).max(200),
  summary_html: z.string().min(1),
  occurred_at: z.string().min(1),
  date_precision: datePrecisionSchema,
  event_type_slug: z.string().min(1),
  topic_slugs: z.array(z.string().min(1)).min(1),
  quotes: z.array(eventQuoteSchema).default([]),
  sources: z.array(eventSourceSchema).min(1),
  media: z.array(eventMediaSchema).default([]),
  confidence: z.enum(["high", "medium", "low"]),
  provenance: z.object({
    pipeline: z.enum(["current", "historical", "pilot"]),
    input_urls: z.array(z.string()),
    model: z.string().optional(),
    generated_at: z.string(),
  }),
});

export type GeneratedNewsEvent = z.infer<typeof generatedNewsEventSchema>;
export type EventSource = z.infer<typeof eventSourceSchema>;
export type EventMedia = z.infer<typeof eventMediaSchema>;

/** Facts-only input to the generator (not a news article dump). */
export const factBundleSchema = z.object({
  facts: z.array(z.string().min(1)).min(1),
  subject_quotes: z
    .array(
      z.object({
        text: z.string().min(1),
        speaker: z.string().min(1),
        source_url: z.string().optional(),
      }),
    )
    .default([]),
  source_urls: z.array(z.string()).default([]),
  publisher_headlines: z.array(z.string()).default([]),
  suggested_occurred_at: z.string().optional(),
  suggested_date_precision: datePrecisionSchema.optional(),
  suggested_event_type_slug: z.string().optional(),
  notes: z.string().optional(),
});

export type FactBundle = z.infer<typeof factBundleSchema>;

export const pilotCaseSchema = z.object({
  id: z.string().min(1),
  description: z.string().optional(),
  topic: z.string().default("elon-musk"),
  urls: z.array(z.string()).default([]),
  /** Primary text when URL fetch fails (e.g. X posts). */
  pasted_text: z.string().optional(),
  facts: z.array(z.string()).optional(),
  subject_quotes: z
    .array(
      z.object({
        text: z.string(),
        speaker: z.string(),
        source_url: z.string().optional(),
      }),
    )
    .optional(),
  suggested_occurred_at: z.string().optional(),
  suggested_date_precision: datePrecisionSchema.optional(),
  suggested_event_type_slug: z.string().optional(),
  notes: z.string().optional(),
});

export type PilotCase = z.infer<typeof pilotCaseSchema>;
