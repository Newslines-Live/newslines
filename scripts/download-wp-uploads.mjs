/**
 * Copy WordPress uploads from the old Kinsta library onto this machine.
 * Reads /app/data/seed.json in production, or ./data/seed.json locally.
 */
import { mkdir, writeFile, stat } from "node:fs/promises";
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import path from "node:path";

const ORIGIN = "https://newslinesorggc.kinsta.cloud";
const DEST = process.env.WP_MEDIA_DEST || path.join(process.cwd(), "public", "wp-content");
const CONCURRENCY = Number(process.env.WP_MEDIA_JOBS || 12);
const SEED =
  process.env.SEED_PATH ||
  (existsSync("/app/data/seed.json")
    ? "/app/data/seed.json"
    : path.join(process.cwd(), "data", "seed.json"));

const EXTRA = [
  "/wp-content/uploads/2023/01/light_green_blob.jpg",
  "/wp-content/uploads/2022/12/Musk-newsline-phone-e1671937673837.png",
  "/wp-content/uploads/2014/07/Elon-Musk.jpg",
  "/wp-content/uploads/2014/11/Twitter-Logo-e1673889881275-250x250.png",
  "/wp-content/uploads/2014/07/Tesla-Motors-Logo-300x300.jpg",
  "/wp-content/uploads/2023/01/Grid-image-thin.jpg",
  "/wp-content/uploads/2023/01/Paul-L-for-Newslines-Testimonial-250x250.jpg",
  "/wp-content/uploads/2023/01/Sammy-for-Newslines-Testimonial-250x250.jpg",
  "/wp-content/uploads/2023/01/Ahmed-for-Newslines-Testimonial-250x250.jpg",
];

function collectPaths() {
  const urls = new Set(EXTRA);
  const re =
    /https?:\/\/(?:www\.)?newslines\.org(\/wp-content\/uploads\/[^"'?\s>]+)/gi;
  const add = (text) => {
    if (!text) return;
    let match;
    while ((match = re.exec(text))) urls.add(match[1].replace(/&amp;/g, "&"));
  };
  const seed = JSON.parse(readFileSync(SEED, "utf8"));
  for (const event of seed.events) {
    add(event.summary_html);
    add(event.media_url);
  }
  for (const topic of seed.topics) add(topic.image_url);
  return [...urls].sort();
}

async function alreadyThere(filePath) {
  try {
    const info = await stat(filePath);
    return info.size > 0;
  } catch {
    return false;
  }
}

async function downloadOne(relPath) {
  const dest = path.join(DEST, relPath.replace(/^\/wp-content\//, ""));
  if (await alreadyThere(dest)) return "skip";
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(`${ORIGIN}${relPath}`, {
    headers: { "User-Agent": "NewslinesMediaCopy/1.0" },
    redirect: "follow",
  });
  if (!res.ok) {
    appendFileSync(path.join(DEST, "failed.txt"), `${res.status} ${relPath}\n`);
    return "fail";
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 20) {
    appendFileSync(path.join(DEST, "failed.txt"), `empty ${relPath}\n`);
    return "fail";
  }
  await writeFile(dest, buf);
  return "ok";
}

async function main() {
  const paths = collectPaths();
  await mkdir(DEST, { recursive: true });
  console.log(`dest=${DEST} files=${paths.length}`);
  let ok = 0;
  let skip = 0;
  let fail = 0;
  let i = 0;
  const queue = [...paths];
  async function worker() {
    while (queue.length) {
      const rel = queue.shift();
      const result = await downloadOne(rel);
      if (result === "ok") ok += 1;
      else if (result === "skip") skip += 1;
      else fail += 1;
      i += 1;
      if (i % 200 === 0 || i === paths.length) {
        console.log(`progress ${i}/${paths.length} ok=${ok} skip=${skip} fail=${fail}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(`done ok=${ok} skip=${skip} fail=${fail}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
