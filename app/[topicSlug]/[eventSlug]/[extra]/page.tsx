import { notFound, permanentRedirect } from "next/navigation";
import { getEventBySlug } from "@/lib/data/seed-store";

type Props = {
  params: Promise<{ topicSlug: string; eventSlug: string; extra: string }>;
};

/** WordPress comment / feed leftovers under an event permalink. */
export default async function EventExtraRedirect({ params }: Props) {
  const { topicSlug, eventSlug, extra } = await params;
  if (
    !/^(comment-page-\d+|feed|comments|amp)$/i.test(extra)
  ) {
    notFound();
  }
  const event = await getEventBySlug(topicSlug, eventSlug);
  if (!event) notFound();
  permanentRedirect(`/${topicSlug}/${eventSlug}`);
}
