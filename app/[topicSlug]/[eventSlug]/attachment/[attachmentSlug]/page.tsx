import { notFound, permanentRedirect } from "next/navigation";
import { getEventBySlug } from "@/lib/data/seed-store";

type Props = {
  params: Promise<{
    topicSlug: string;
    eventSlug: string;
    attachmentSlug: string;
  }>;
};

function firstUploadPath(event: {
  media_url: string | null;
  summary_html: string;
}): string | null {
  const html = `${event.media_url || ""}\n${event.summary_html || ""}`;
  const match = html.match(
    /(?:https?:\/\/(?:www\.)?newslines\.org)?(\/wp-content\/uploads\/[^"'?\s>]+)/i
  );
  return match?.[1] ?? null;
}

/** Old WordPress attachment permalinks now go to the actual image file. */
export default async function EventAttachmentRedirect({ params }: Props) {
  const { topicSlug, eventSlug } = await params;
  const event = await getEventBySlug(topicSlug, eventSlug);
  if (!event) notFound();
  const imagePath = firstUploadPath(event);
  permanentRedirect(imagePath || `/${topicSlug}/${eventSlug}/`);
}
