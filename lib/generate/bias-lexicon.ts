/** Narrator-forbidden loaded language (quotes are exempt during validation). */
export const BIAS_LEXICON: readonly string[] = [
  "slams",
  "blasts",
  "rips",
  "bombshell",
  "chaotic",
  "disastrous",
  "heroic",
  "shameful",
  "woke",
  "far-left",
  "far left",
  "far-right",
  "far right",
  "regime",
  "shockingly",
  "clearly",
  "finally",
  "exposes",
  "destroys",
  "obliterates",
  "annihilates",
  "terrorizes",
  "left-wing conspiracy",
  "right-wing conspiracy",
  "so-called",
  "supposedly",
  "allegedly masterminded",
  "brilliantly",
  "stupidly",
  "tyrant",
  "dictator",
  "cult",
  "brainwashed",
];

export function findBiasHits(narratorText: string): string[] {
  const lower = narratorText.toLowerCase();
  return BIAS_LEXICON.filter((term) => lower.includes(term.toLowerCase()));
}

/** Full personal names that should not appear in Newslines title/body (use short form). */
export const FULL_NAME_PATTERNS: readonly RegExp[] = [
  /\belon\s+musk\b/i,
  /\bdonald\s+trump\b/i,
  /\bjoe\s+biden\b/i,
  /\bbarack\s+obama\b/i,
  /\bconor\s+mcgregor\b/i,
  /\blinda\s+yaccarino\b/i,
];

export function findFullNameHits(titleAndBody: string): string[] {
  const hits: string[] = [];
  for (const re of FULL_NAME_PATTERNS) {
    const m = titleAndBody.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}
