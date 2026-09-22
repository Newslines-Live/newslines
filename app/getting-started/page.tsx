import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";

export const metadata = { title: "Getting Started" };

export default function GettingStartedPage() {
  return (
    <StaticPage title="Getting started">
      <p>
        The easiest way to get started is to pick a topic and read a newsline.
        Every event is a just-the-facts summary, tagged by topic and event type.
      </p>
      <p>
        <Link href="/grid">Explore The Grid</Link> to browse topics, or start
        with{" "}
        <Link href="/elon-musk">Elon Musk</Link> or{" "}
        <Link href="/conor-mcgregor">Conor McGregor</Link>.
      </p>
      <p>
        Contributor accounts (register, login, and posting) are not on this
        rebuild yet. The news archive is here for readers, and Google links to
        existing newslines still work. If you want to write or help rebuild
        contributor tools, email{" "}
        <a href="mailto:info@newslines.org">info@newslines.org</a>.
      </p>
    </StaticPage>
  );
}
