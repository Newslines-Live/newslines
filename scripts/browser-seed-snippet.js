(async () => {
  const WP = "https://newslines.org/wp-json/wp/v2";
  const perTopic = 40;
  const musk = [
    "elon-musk",
    "tesla-inc",
    "spacex",
    "twitter",
    "starship-rocket",
    "neuralink",
    "the-boring-company",
  ];
  const mcg = [
    "conor-mcgregor",
    "ufc",
    "dana-white",
    "floyd-mayweather-jr",
    "khabib-nurmagomedov",
    "nate-diaz",
  ];
  const hubs = new Set(["elon-musk", "conor-mcgregor"]);
  const clusterOf = (slug) =>
    musk.includes(slug) ? "musk" : mcg.includes(slug) ? "mcgregor" : null;

  const stableId = (prefix, key) => {
    const s = String(prefix) + ":" + String(key);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const a = (h >>> 0).toString(16).padStart(8, "0");
    const b = (Math.imul(h, 31) >>> 0).toString(16).padStart(8, "0");
    const c = (Math.imul(h, 17) >>> 0).toString(16).padStart(8, "0");
    const d = (Math.imul(h, 13) >>> 0).toString(16).padStart(8, "0");
    const hex = (a + b + c + d).slice(0, 32);
    return (
      hex.slice(0, 8) +
      "-" +
      hex.slice(8, 12) +
      "-" +
      hex.slice(12, 16) +
      "-" +
      hex.slice(16, 20) +
      "-" +
      hex.slice(20, 32)
    );
  };

  const decode = (html) =>
    String(html || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&#8217;/g, "'")
      .replace(/&amp;/g, "&")
      .trim();

  async function j(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status + " " + url);
    return r.json();
  }
  async function text(url) {
    const r = await fetch(url);
    if (!r.ok) return "";
    return r.text();
  }

  const topicsByWp = {};
  const postsById = {};
  const preferred = {};
  const typeByPostSlug = {};

  for (const slug of musk.concat(mcg)) {
    const cats = await j(WP + "/categories?slug=" + encodeURIComponent(slug));
    const cat = cats[0];
    if (!cat) continue;
    let image = (cat.yoast_head_json &&
      cat.yoast_head_json.og_image &&
      cat.yoast_head_json.og_image[0] &&
      cat.yoast_head_json.og_image[0].url) ||
      null;
    if (!image) {
      const html = await text("https://newslines.org/" + slug + "/");
      const idx = html.indexOf('property="og:image"');
      if (idx >= 0) {
        const slice = html.slice(idx, idx + 400);
        const m = slice.match(/content="([^"]+)"/);
        if (m) image = m[1];
      }
      const typesParts = html.split("<article");
      for (let i = 0; i < typesParts.length; i++) {
        const part = typesParts[i];
        const titleLink = part.match(
          /href="https?:\/\/newslines\.org\/[^/]+\/([a-z0-9-]+)\//i
        );
        const typeLink = part.match(/\/events\/([a-z0-9-]+)\//i);
        if (
          titleLink &&
          typeLink &&
          titleLink[1] !== "events"
        ) {
          typeByPostSlug[titleLink[1]] = typeLink[1];
        }
      }
    } else {
      const html = await text("https://newslines.org/" + slug + "/");
      const typesParts = html.split("<article");
      for (let i = 0; i < typesParts.length; i++) {
        const part = typesParts[i];
        const titleLink = part.match(
          /href="https?:\/\/newslines\.org\/[^/]+\/([a-z0-9-]+)\//i
        );
        const typeLink = part.match(/\/events\/([a-z0-9-]+)\//i);
        if (titleLink && typeLink && titleLink[1] !== "events") {
          typeByPostSlug[titleLink[1]] = typeLink[1];
        }
      }
    }

    topicsByWp[cat.id] = {
      id: stableId("topic", cat.id),
      slug: cat.slug,
      name: decode(cat.name),
      bio: cat.description ? decode(cat.description) : null,
      image_url: image,
      is_featured: hubs.has(cat.slug),
      cluster: clusterOf(cat.slug),
      wp_category_id: cat.id,
      post_count: 0,
      last_event_at: null,
    };

    const posts = await j(
      WP +
        "/posts?categories=" +
        cat.id +
        "&per_page=" +
        perTopic +
        "&orderby=date&order=desc&_fields=id,slug,link,title,content,date,categories"
    );
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      if (!postsById[p.id]) {
        postsById[p.id] = p;
        preferred[p.id] = slug;
      }
    }
  }

  const allCatIds = {};
  Object.keys(postsById).forEach((id) => {
    postsById[id].categories.forEach((cid) => {
      allCatIds[cid] = true;
    });
  });
  const catIdList = Object.keys(allCatIds).map(Number);
  for (let i = 0; i < catIdList.length; i++) {
    const id = catIdList[i];
    if (topicsByWp[id]) continue;
    try {
      const cat = await j(WP + "/categories/" + id);
      const image =
        (cat.yoast_head_json &&
          cat.yoast_head_json.og_image &&
          cat.yoast_head_json.og_image[0] &&
          cat.yoast_head_json.og_image[0].url) ||
        null;
      topicsByWp[id] = {
        id: stableId("topic", cat.id),
        slug: cat.slug,
        name: decode(cat.name),
        bio: cat.description ? decode(cat.description) : null,
        image_url: image,
        is_featured: false,
        cluster: clusterOf(cat.slug),
        wp_category_id: cat.id,
        post_count: 0,
        last_event_at: null,
      };
    } catch (e) {}
  }

  const eventTypes = {};
  const events = [];
  const eventTopics = [];
  const postList = Object.keys(postsById).map((k) => postsById[k]);
  for (let i = 0; i < postList.length; i++) {
    const post = postList[i];
    const typeSlug = typeByPostSlug[post.slug] || null;
    let event_type_id = null;
    if (typeSlug) {
      if (!eventTypes[typeSlug]) {
        eventTypes[typeSlug] = {
          id: stableId("etype", typeSlug),
          slug: typeSlug,
          name: typeSlug
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          parent_slug: null,
        };
      }
      event_type_id = eventTypes[typeSlug].id;
    }
    const linkMatch = post.link.match(/newslines\.org\/([^/]+)\//);
    const canonical = (linkMatch && linkMatch[1]) || preferred[post.id];
    const eventId = stableId("event", post.id);
    events.push({
      id: eventId,
      slug: post.slug,
      title: decode(post.title.rendered),
      summary_html: post.content.rendered,
      occurred_at: new Date(post.date).toISOString(),
      event_type_id: event_type_id,
      canonical_topic_slug: canonical,
      media_url: null,
      wp_post_id: post.id,
    });
    for (let c = 0; c < post.categories.length; c++) {
      const t = topicsByWp[post.categories[c]];
      if (t) eventTopics.push({ event_id: eventId, topic_id: t.id });
    }
  }

  const topics = Object.keys(topicsByWp).map((k) => topicsByWp[k]);
  for (let i = 0; i < topics.length; i++) {
    const t = topics[i];
    const linked = eventTopics.filter((et) => et.topic_id === t.id);
    t.post_count = linked.length;
    const dates = linked
      .map((et) => {
        const ev = events.find((e) => e.id === et.event_id);
        return ev ? ev.occurred_at : null;
      })
      .filter(Boolean)
      .sort();
    t.last_event_at = dates.length ? dates[dates.length - 1] : null;
  }
  topics.sort((a, b) => b.post_count - a.post_count);

  const seed = {
    topics: topics,
    eventTypes: Object.keys(eventTypes).map((k) => eventTypes[k]),
    events: events,
    eventTopics: eventTopics,
  };
  window.__NEWSLINES_SEED__ = seed;
  return {
    topics: topics.length,
    events: events.length,
    eventTypes: seed.eventTypes.length,
    eventTopics: eventTopics.length,
    hubs: topics
      .filter((t) => t.is_featured)
      .map((t) => ({ slug: t.slug, posts: t.post_count, img: !!t.image_url })),
  };
})()
