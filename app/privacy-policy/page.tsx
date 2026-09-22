import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <StaticPage title="Privacy Policy">
      <p>
        This rebuild of Newslines is a reader site. We do not offer account
        registration or comments on this version, so we do not collect login
        details or profile data here.
      </p>
      <p>
        The site may use standard hosting, analytics, and font-loading services
        that process technical data such as IP address and browser type. You
        can block cookies in your browser settings.
      </p>
      <p>
        For privacy requests about the older WordPress site, or any other
        enquiry, email{" "}
        <a href="mailto:info@newslines.org">info@newslines.org</a>. See also{" "}
        <Link href="/about">About</Link> and <Link href="/contact">Contact</Link>
        .
      </p>
    </StaticPage>
  );
}
