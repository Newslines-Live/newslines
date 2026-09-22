import hierarchy from "../wp/event-type-hierarchy.json";

const parentToLeaves = hierarchy as Record<string, string[]>;

const leafSet = new Set<string>();
const leafToParent = new Map<string, string>();

for (const [parent, leaves] of Object.entries(parentToLeaves)) {
  for (const leaf of leaves) {
    leafSet.add(leaf);
    leafToParent.set(leaf, parent);
  }
}

export const EVENT_TYPE_LEAVES: readonly string[] = [...leafSet].sort();

export function isEventTypeLeaf(slug: string): boolean {
  return leafSet.has(slug);
}

export function parentForEventType(slug: string): string | null {
  return leafToParent.get(slug) ?? null;
}

/** Compact list for LLM system prompt (parents grouped). */
export function formatEventTypeListForPrompt(): string {
  const lines: string[] = [];
  for (const [parent, leaves] of Object.entries(parentToLeaves)) {
    lines.push(`${parent}: ${leaves.join(", ")}`);
  }
  return lines.join("\n");
}
