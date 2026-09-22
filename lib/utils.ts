import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Decode WP HTML entities in titles/names for plain-text React rendering. */
export function decodeHtmlEntities(input: string): string {
  if (!input) return input;
  return input
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—");
}

/** Matches live newslines.org: "22 Sep, 2025" (or month/year when precision is coarser). */
export function formatEventDate(
  iso: string | Date,
  precision: "exact" | "month" | "year" = "exact"
): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  if (precision === "year") return String(d.getUTCFullYear());
  if (precision === "month") {
    return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
}

function youtubeEmbedHtml(videoId: string, title: string): string {
  const safeTitle = decodeHtmlEntities(decodeHtmlEntities(title))
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return (
    `<div class="nl-video">` +
    `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" ` +
    `title="${safeTitle}" ` +
    `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ` +
    `allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin">` +
    `</iframe></div>`
  );
}

/**
 * Convert WP YouTube Lyte placeholders (plugin JS/CSS not shipped) into
 * responsive youtube-nocookie iframes so embeds render in the Next app.
 */
export function transformSummaryHtml(html: string): string {
  if (!html || !html.includes("lyte-wrapper")) return html;

  const re = /<div class="lyte-wrapper"([^>]*)>/gi;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html)) !== null) {
    const start = match.index;
    const after = html.slice(start);
    const idMatch = after.match(/id="lyte_([A-Za-z0-9_-]+)"/);
    const llMatch = after.match(/<div class="lL"[^>]*><\/div>/);
    if (!idMatch || !llMatch || llMatch.index == null) continue;

    const end = start + llMatch.index + llMatch[0].length;
    const title =
      (match[1].match(/title="([^"]*)"/) || [])[1] || "YouTube video";
    result += html.slice(lastIndex, start) + youtubeEmbedHtml(idMatch[1], title);
    lastIndex = end;
    re.lastIndex = end;
  }

  result += html.slice(lastIndex);
  return result;
}
