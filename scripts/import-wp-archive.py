#!/usr/bin/env python3
"""
Import the offline WordPress dump (training/data/wp_summaries.json) into
data/seed.json for the Next.js app. No LLM. No live WP calls required.

  python scripts/import-wp-archive.py
  python scripts/import-wp-archive.py --limit 500
  python scripts/import-wp-archive.py --clusters-only
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_WP = Path(
    r"C:\Users\spark\.cursor-tutor\Projects\training\data\wp_summaries.json"
)
DEFAULT_DATES = Path(
    r"C:\Users\spark\.cursor-tutor\Projects\training\news_summary_dataset\SQL Dump\wp_newslines_events.json"
)
DEFAULT_CATS = Path(
    r"C:\Users\spark\.cursor-tutor\Projects\training\data\category_mapping.json"
)
HIERARCHY_PATH = ROOT / "lib" / "wp" / "event-type-hierarchy.json"
EXISTING_SEED = ROOT / "data" / "seed.json"
OUT_PATH = ROOT / "data" / "seed.json"

MUSK = {
    "elon-musk",
    "tesla-inc",
    "spacex",
    "twitter",
    "starship-rocket",
    "neuralink",
    "the-boring-company",
}
MCGREGOR = {
    "conor-mcgregor",
    "ufc",
    "dana-white",
    "floyd-mayweather-jr",
    "khabib-nurmagomedov",
    "nate-diaz",
}
HUBS = {"elon-musk", "conor-mcgregor"}

PRECISION_MAP = {
    "daymonthyear": "exact",
    "time": "exact",
    "monthyear": "month",
    "year": "year",
}

SKIP_QUOTE_PATTERNS = (
    "Twitter could not be reached",
    "This Tweet has been deleted",
    "Click to read the rest of the thread",
)


def stable_id(prefix: str, key: str | int) -> str:
    digest = hashlib.sha256(f"{prefix}:{key}".encode("utf-8")).hexdigest()[:32]
    return f"{digest[:8]}-{digest[8:12]}-{digest[12:16]}-{digest[16:20]}-{digest[20:32]}"


def slugify(name: str) -> str:
    s = html.unescape(name).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "topic"


def decode_title(raw: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", raw or "")).strip()


def cluster_for(slug: str) -> str | None:
    if slug in MUSK:
        return "musk"
    if slug in MCGREGOR:
        return "mcgregor"
    return None


def load_event_dates(path: Path) -> dict[str, dict]:
    print(f"Loading event dates from {path}…")
    with path.open(encoding="utf-8") as f:
        dump = json.load(f)
    table = next(
        (e for e in dump if isinstance(e, dict) and e.get("type") == "table" and "data" in e),
        None,
    )
    if not table:
        raise SystemExit("Could not find event dates table in SQL dump")
    out: dict[str, dict] = {}
    for row in table["data"]:
        pid = str(row.get("post_id") or "")
        if not pid or not row.get("event_date"):
            continue
        out[pid] = {
            "event_date": row["event_date"],
            "date_display": row.get("date_display") or "daymonthyear",
        }
    print(f"  {len(out)} event dates")
    return out


def load_hierarchy(path: Path) -> dict[str, str]:
    with path.open(encoding="utf-8") as f:
        hierarchy = json.load(f)
    reverse: dict[str, str] = {}
    for parent, types in hierarchy.items():
        for t in types:
            reverse[t] = parent
    # aliases used in WP class_list
    reverse.setdefault("statement", "statements")
    reverse.setdefault("make-statement", "statements")
    return reverse


def event_type_from_classes(class_list: list[str], reverse: dict[str, str]) -> list[dict]:
    found = []
    seen = set()
    for cls in class_list or []:
        if not isinstance(cls, str) or not cls.startswith("event-"):
            continue
        raw = cls[6:]
        if raw in seen:
            continue
        seen.add(raw)
        name = "Makes Statement" if raw in ("statement", "make-statement") else raw.replace("-", " ").title()
        slug = "makes-statement" if raw in ("statement", "make-statement") else raw
        parent = reverse.get(raw) or reverse.get(slug) or None
        found.append({"slug": slug, "name": name, "parent_slug": parent})
    return found


def extract_quotes(content_html: str) -> list[dict]:
    quotes = []
    for m in re.finditer(
        r"<blockquote(?![^>]*twitter-tweet)[^>]*>(.*?)</blockquote>",
        content_html or "",
        flags=re.I | re.S,
    ):
        text = re.sub(r"<[^>]+>", "", m.group(1))
        text = html.unescape(" ".join(text.split())).strip()
        if not text or any(p in text for p in SKIP_QUOTE_PATTERNS):
            continue
        quotes.append({"text": text, "speaker": None})
    return quotes


def extract_source_url(content_html: str) -> str | None:
    m = re.search(r'href=["\']([^"\']+)["\']', content_html or "", flags=re.I)
    if not m:
        return None
    url = m.group(1)
    if "twitter.com" in url or "x.com" in url:
        return url.split("?")[0]
    return url


def extract_media_url(content_html: str) -> str | None:
    # YouTube lyte / youtu.be
    m = re.search(
        r'(?:youtube\.com/watch\?v=|youtu\.be/|lyteCache\.php\?[^"]*vi%2F)([A-Za-z0-9_-]{6,})',
        content_html or "",
        flags=re.I,
    )
    if m:
        return f"https://www.youtube.com/watch?v={m.group(1)}"
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content_html or "", flags=re.I)
    return m.group(1) if m else None


def to_iso(event_date: str | None, fallback: str) -> str:
    raw = event_date or fallback
    raw = raw.replace(" ", "T")
    if re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$", raw):
        raw += "Z"
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat().replace("+00:00", ".000Z")
    except ValueError:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", ".000Z")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wp", type=Path, default=DEFAULT_WP)
    ap.add_argument("--dates", type=Path, default=DEFAULT_DATES)
    ap.add_argument("--categories", type=Path, default=DEFAULT_CATS)
    ap.add_argument("--limit", type=int, default=0, help="Max posts (0 = all)")
    ap.add_argument(
        "--clusters-only",
        action="store_true",
        help="Only keep events linked to Musk/McGregor cluster topics",
    )
    ap.add_argument("--out", type=Path, default=OUT_PATH)
    args = ap.parse_args()

    if not args.wp.exists():
        raise SystemExit(f"WP dump not found: {args.wp}")

    event_dates = load_event_dates(args.dates)
    reverse = load_hierarchy(HIERARCHY_PATH)

    print(f"Loading categories from {args.categories}…")
    with args.categories.open(encoding="utf-8") as f:
        cat_raw = json.load(f)

    # Preserve images/slugs from existing seed where possible
    existing_by_wp: dict[int, dict] = {}
    if EXISTING_SEED.exists():
        try:
            with EXISTING_SEED.open(encoding="utf-8") as f:
                old = json.load(f)
            for t in old.get("topics", []):
                wid = t.get("wp_category_id")
                if wid is not None:
                    existing_by_wp[int(wid)] = t
            print(f"  reused {len(existing_by_wp)} topics from existing seed")
        except Exception as e:
            print(f"  warn: could not read existing seed: {e}")

    topics: dict[int, dict] = {}
    for cid_str, info in cat_raw.items():
        cid = int(cid_str)
        name = decode_title(info.get("name") or f"Category {cid}")
        prev = existing_by_wp.get(cid)
        slug = (prev or {}).get("slug") or slugify(name)
        topics[cid] = {
            "id": (prev or {}).get("id") or stable_id("topic", cid),
            "slug": slug,
            "name": name,
            "bio": (prev or {}).get("bio"),
            "image_url": (prev or {}).get("image_url"),
            "is_featured": slug in HUBS,
            "cluster": cluster_for(slug),
            "wp_category_id": cid,
            "post_count": 0,
            "last_event_at": None,
        }

    print(f"Loading posts from {args.wp} (this takes a minute)…")
    with args.wp.open(encoding="utf-8") as f:
        posts = json.load(f)
    print(f"  {len(posts)} posts in dump")

    if args.limit and args.limit > 0:
        posts = posts[: args.limit]
        print(f"  limited to {len(posts)}")

    event_types: dict[str, dict] = {}
    events: list[dict] = []
    event_topics: list[dict] = []
    cluster_topic_ids = {
        t["id"] for t in topics.values() if t["cluster"] in ("musk", "mcgregor")
    }

    for i, post in enumerate(posts):
        if i and i % 5000 == 0:
            print(f"  processed {i}/{len(posts)}…")

        pid = post.get("id")
        if pid is None:
            continue

        type_infos = event_type_from_classes(post.get("class_list") or [], reverse)
        event_type_id = None
        if type_infos:
            primary = type_infos[0]
            if primary["slug"] not in event_types:
                event_types[primary["slug"]] = {
                    "id": stable_id("etype", primary["slug"]),
                    "slug": primary["slug"],
                    "name": primary["name"],
                    "parent_slug": primary["parent_slug"],
                }
            event_type_id = event_types[primary["slug"]]["id"]
            # register any extras
            for ti in type_infos[1:]:
                if ti["slug"] not in event_types:
                    event_types[ti["slug"]] = {
                        "id": stable_id("etype", ti["slug"]),
                        "slug": ti["slug"],
                        "name": ti["name"],
                        "parent_slug": ti["parent_slug"],
                    }

        date_info = event_dates.get(str(pid), {})
        precision = PRECISION_MAP.get(date_info.get("date_display", "daymonthyear"), "exact")
        occurred = to_iso(date_info.get("event_date"), post.get("date_gmt") or post.get("date") or "")

        content = (post.get("content") or {}).get("rendered") or ""
        link = post.get("link") or ""
        canonical = None
        m = re.search(r"newslines\.org/([^/]+)/", link)
        if m:
            canonical = m.group(1)

        title = decode_title((post.get("title") or {}).get("rendered") or "")
        slug = post.get("slug") or slugify(title) or f"post-{pid}"
        event_id = stable_id("event", pid)

        cat_ids = [int(c) for c in (post.get("categories") or []) if c is not None]
        linked_topic_ids = []
        for cid in cat_ids:
            topic = topics.get(cid)
            if not topic:
                # unknown category — create stub
                topic = {
                    "id": stable_id("topic", cid),
                    "slug": f"category-{cid}",
                    "name": f"Category {cid}",
                    "bio": None,
                    "image_url": None,
                    "is_featured": False,
                    "cluster": None,
                    "wp_category_id": cid,
                    "post_count": 0,
                    "last_event_at": None,
                }
                topics[cid] = topic
            linked_topic_ids.append(topic["id"])

        if args.clusters_only:
            if not any(tid in cluster_topic_ids for tid in linked_topic_ids):
                # also allow if canonical slug is a cluster hub/member
                if canonical not in MUSK | MCGREGOR:
                    continue

        events.append(
            {
                "id": event_id,
                "slug": slug,
                "title": title,
                "summary_html": content,
                "occurred_at": occurred,
                "date_precision": precision,
                "event_type_id": event_type_id,
                "canonical_topic_slug": canonical,
                "media_url": extract_media_url(content),
                "source_url": extract_source_url(content),
                "wp_post_id": int(pid),
                "quotes": extract_quotes(content),
            }
        )
        for tid in linked_topic_ids:
            event_topics.append({"event_id": event_id, "topic_id": tid})

    # topic stats
    by_topic: dict[str, list[str]] = defaultdict(list)
    event_date_by_id = {e["id"]: e["occurred_at"] for e in events}
    for et in event_topics:
        by_topic[et["topic_id"]].append(et["event_id"])

    topic_list = []
    for topic in topics.values():
        eids = by_topic.get(topic["id"], [])
        if args.clusters_only and not eids and topic["cluster"] is None:
            continue
        topic["post_count"] = len(eids)
        dates = sorted(event_date_by_id[eid] for eid in eids if eid in event_date_by_id)
        topic["last_event_at"] = dates[-1] if dates else None
        if topic["post_count"] > 0 or topic["cluster"] is not None:
            topic_list.append(topic)

    topic_list.sort(key=lambda t: t["post_count"], reverse=True)

    seed = {
        "topics": topic_list,
        "eventTypes": list(event_types.values()),
        "events": events,
        "eventTopics": event_topics,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    print(f"Writing {args.out}…")
    with args.out.open("w", encoding="utf-8") as f:
        json.dump(seed, f, ensure_ascii=False, separators=(",", ":"))

    size_mb = args.out.stat().st_size / (1024 * 1024)
    print(
        f"Done: {len(seed['topics'])} topics, {len(seed['events'])} events, "
        f"{len(seed['eventTypes'])} types -> {size_mb:.1f} MB"
    )


if __name__ == "__main__":
    main()
