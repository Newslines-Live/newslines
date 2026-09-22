import { readFileSync, writeFileSync } from "node:fs";

const seed = JSON.parse(readFileSync("data/seed.json", "utf8"));
const extraFiles = [
  "app/page.tsx",
  "components/home/TestimonialCarousel.tsx",
];

const urls = new Set();
const re =
  /https?:\/\/(?:www\.)?newslines\.org(\/wp-content\/uploads\/[^"'?\s>]+)/gi;

function collect(text) {
  if (!text) return;
  let match;
  while ((match = re.exec(text))) {
    urls.add(match[1].replace(/&amp;/g, "&"));
  }
}

for (const event of seed.events) {
  collect(event.summary_html);
  collect(event.media_url);
}
for (const topic of seed.topics) collect(topic.image_url);
for (const file of extraFiles) collect(readFileSync(file, "utf8"));

const paths = [...urls].sort();
writeFileSync(
  "scripts/_wp-uploads.json",
  JSON.stringify({ count: paths.length, paths }, null, 2)
);
console.log(`unique uploads: ${paths.length}`);
console.log(paths.slice(0, 8).join("\n"));
