import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        Not found
      </h1>
      <p className="mt-3 text-neutral-600">That newsline or event doesn’t exist in the seed.</p>
      <Link
        href="/grid"
        className="mt-6 inline-block font-semibold text-[var(--nl-orange)] hover:underline"
      >
        Back to The Grid
      </Link>
    </div>
  );
}
