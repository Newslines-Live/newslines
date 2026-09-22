import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <StaticPage title="Contact">
      <p>
        Newslines is run by The Social News Company Ltd., registered in
        Scotland (SC532497).
      </p>
      <p>
        Email{" "}
        <a href="mailto:info@newslines.org">info@newslines.org</a> for press,
        corrections, or contributor enquiries.
      </p>
      <p>
        Read <Link href="/about">about Newslines</Link>, or browse topics on{" "}
        <Link href="/grid">The Grid</Link>.
      </p>
    </StaticPage>
  );
}
