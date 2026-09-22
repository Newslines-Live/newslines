import Link from "next/link";
import { listTopics, loadSeedData } from "@/lib/data/seed-store";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const [topics, seed] = await Promise.all([listTopics(), loadSeedData()]);
  const featured = [...topics]
    .sort((a, b) => b.post_count - a.post_count)
    .slice(0, 40);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        Admin
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Minimal read-only dashboard for the local seed. Wire Supabase auth + CRUD when a
        project is connected. Re-seed with{" "}
        <code className="rounded bg-neutral-100 px-1">npm run seed:archive</code>.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Topics" value={seed.topics.length} />
        <Stat label="Events" value={seed.events.length} />
        <Stat label="Event types" value={seed.eventTypes.length} />
      </div>

      <h2 className="mt-10 text-lg font-bold">Top topics by posts</h2>
      <div className="mt-3 overflow-x-auto rounded-sm border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Cluster</th>
              <th className="px-3 py-2">Posts</th>
              <th className="px-3 py-2">Featured</th>
            </tr>
          </thead>
          <tbody>
            {featured.map((t) => (
              <tr key={t.id} className="border-t border-black/5">
                <td className="px-3 py-2">
                  <Link href={`/${t.slug}`} className="text-[var(--nl-orange)] hover:underline">
                    {t.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{t.cluster ?? "—"}</td>
                <td className="px-3 py-2">{t.post_count}</td>
                <td className="px-3 py-2">{t.is_featured ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-black/10 bg-white px-4 py-5">
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}
