import { NextRequest, NextResponse } from "next/server";

const ALLOWED = [
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "newslines.org",
];

/**
 * Proxies topic images so Wikimedia hotlink / UA blocks don't blank the mosaic.
 * Usage: /api/topic-image?url=<encoded remote url>
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Bad url" }, { status: 400 });
  }

  if (!ALLOWED.some((h) => target.hostname === h || target.hostname.endsWith(`.${h}`))) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const upstream = await fetch(target.toString(), {
    headers: {
      "User-Agent": "NewslinesBot/1.0 (https://newslines.org; image-proxy)",
      Accept: "image/*,*/*;q=0.8",
    },
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const type = upstream.headers.get("content-type") || "image/jpeg";
  if (!type.startsWith("image/")) {
    return NextResponse.json({ error: "Not an image" }, { status: 502 });
  }

  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
