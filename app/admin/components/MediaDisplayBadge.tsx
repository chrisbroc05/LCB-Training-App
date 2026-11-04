import {
  formatMediaDisplayStatusLabel,
  mediaBadgeClassName,
  type MediaDisplayStatus,
} from "@/lib/media-consent-shared";

export default function MediaDisplayBadge(props: { status: MediaDisplayStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${mediaBadgeClassName(props.status)}`}
    >
      {formatMediaDisplayStatusLabel(props.status)}
    </span>
  );
}
