import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";

export const metadata = { title: "Newslines vs Wikipedia" };

export default function AboutPage() {
  return (
    <StaticPage title="Newslines vs Wikipedia">
      <p>
        Newslines is a news network that aims to give readers the complete,
        interactive news history of any topic. For example, our newsline of{" "}
        <Link href="/conor-mcgregor">Conor McGregor</Link>, the UFC fighter, has
        thousands of curated and tagged news events. As we add thousands more
        topics Newslines will become the world’s largest curated news archive.
      </p>
      <p>
        Because newslines are made from news events, they can be sorted and
        filtered. Readers can view each newsline in breaking news view (newest
        news first) or sort it from oldest news to latest news to give a{" "}
        <em>biography view</em> of the topic. Readers can also filter each
        newsline to find specific event types, for example to find all of{" "}
        <Link href="/event/legal">Conor McGregor’s legal issues</Link>
        .
      </p>
      <p>
        Newslines was founded by{" "}
        <Link href="/mark-mary-devlin">Mark &amp; Mary Devlin</Link>, who are
        from Glasgow, Scotland. After moving to Japan in 1989, Mark &amp; Mary
        founded Japan’s No. 1 English magazine, <em>Metropolis</em>, in 1993. In
        2000 they founded japantoday.com, the world’s largest news site about
        Japan in English. They sold their businesses in Japan in 2007, and after
        spending eight years in the U.S. and 26 years overseas in total, they
        returned to Scotland in 2016.
      </p>
      <p>
        Browse topics on <Link href="/grid">The Grid</Link>, or read more on the{" "}
        <Link href="/blog">Newslines blog</Link>.
      </p>
    </StaticPage>
  );
}
