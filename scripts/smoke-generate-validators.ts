import gold from "../content/pilot-musk/gold/few-shots.json";
import { isEventTypeLeaf, EVENT_TYPE_LEAVES } from "../lib/generate/event-type-leaves";
import { validateGeneratedEvent } from "../lib/generate/validate";

const g = gold[1];
const bundle = {
  facts: [
    "Musk posts on X",
    "Free speech is the bedrock of democracy is the quote text",
  ],
  subject_quotes: [
    {
      text: "Free speech is the bedrock of democracy.",
      speaker: "Elon Musk",
    },
  ],
  source_urls: ["https://x.com/elonmusk"],
  publisher_headlines: [] as string[],
};

const r = validateGeneratedEvent(g, bundle);
console.log(
  "gold ok",
  r.ok,
  "errors",
  r.errors.map((e) => e.code),
  "warnings",
  r.warnings.map((w) => w.code),
);

const bad = {
  ...g,
  summary_html: "<p>Musk slams critics</p>",
  topic_slugs: ["tesla-inc"],
};
const r2 = validateGeneratedEvent(bad, bundle);
console.log(
  "bad ok",
  r2.ok,
  "error codes",
  r2.errors.map((e) => e.code),
);

console.log(
  "leaf count",
  EVENT_TYPE_LEAVES.length,
  "makes-statement",
  isEventTypeLeaf("makes-statement"),
  "bogus",
  isEventTypeLeaf("bogus-type"),
);

if (!r.ok) process.exitCode = 1;
if (r2.ok) process.exitCode = 1;
