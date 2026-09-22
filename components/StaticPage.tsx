export function StaticPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--nl-wash)]">
      <article className="mx-auto max-w-[850px] px-4 py-8 sm:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-[34px] font-semibold leading-tight tracking-tight text-[#222]">
          {title}
        </h1>
        <div className="prose-nl mt-6 text-base leading-[1.65] text-black">
          {children}
        </div>
      </article>
    </div>
  );
}
