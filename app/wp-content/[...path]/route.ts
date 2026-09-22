import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".log": "text/plain; charset=utf-8",
};

function mediaRoot() {
  return path.join(process.cwd(), "public", "wp-content");
}

function resolveSafe(parts: string[]) {
  const rel = parts.join("/");
  if (!rel || rel.includes("\0") || rel.split("/").includes("..")) return null;
  const abs = path.resolve(mediaRoot(), rel);
  if (!abs.startsWith(mediaRoot())) return null;
  return abs;
}

async function fileResponse(filePath: string, method: "GET" | "HEAD") {
  const info = await stat(filePath);
  if (!info.isFile()) return new NextResponse("Not found", { status: 404 });
  const type = TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  const headers = {
    "Content-Type": type,
    "Content-Length": String(info.size),
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  if (method === "HEAD") return new NextResponse(null, { status: 200, headers });
  const buf = await readFile(filePath);
  return new NextResponse(buf, { status: 200, headers });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const filePath = resolveSafe((await params).path);
  if (!filePath) return new NextResponse("Not found", { status: 404 });
  try {
    return await fileResponse(filePath, "GET");
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

export async function HEAD(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const filePath = resolveSafe((await params).path);
  if (!filePath) return new NextResponse("Not found", { status: 404 });
  try {
    return await fileResponse(filePath, "HEAD");
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
