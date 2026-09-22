import { readdir, readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function countFiles(dir: string): Promise<number> {
  let total = 0;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) total += await countFiles(next);
    else if (entry.isFile()) total += 1;
  }
  return total;
}

export async function GET() {
  const root = path.join(process.cwd(), "public", "wp-content");
  let files = 0;
  let log = "";
  let failed = "";
  try {
    files = await countFiles(path.join(root, "uploads"));
  } catch {
    files = 0;
  }
  try {
    log = (await readFile(path.join(root, "download.log"), "utf8")).slice(-2000);
  } catch {
    log = "";
  }
  try {
    failed = (await readFile(path.join(root, "failed.txt"), "utf8")).slice(-500);
  } catch {
    failed = "";
  }
  let rootExists = false;
  try {
    rootExists = (await stat(root)).isDirectory();
  } catch {
    rootExists = false;
  }
  return NextResponse.json({ root, rootExists, files, log, failed });
}
