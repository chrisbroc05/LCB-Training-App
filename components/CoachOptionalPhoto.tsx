import Image from "next/image";

import { COACH_PHOTO_PUBLIC_PATH } from "@/lib/coach-bio-content";
import { coachHeadshotFileExists } from "@/lib/coach-photo-shared";

type CoachOptionalPhotoProps = {
  /** Tailwind classes on the outer wrapper (centering, margins). */
  className?: string;
  /** Image width/height in px for next/image. */
  size?: number;
  /** rounded-full for circle, rounded-2xl for card, etc. */
  roundedClass?: string;
  priority?: boolean;
};

export default function CoachOptionalPhoto({
  className = "",
  size = 160,
  roundedClass = "rounded-2xl",
  priority = false,
}: CoachOptionalPhotoProps) {
  if (!coachHeadshotFileExists()) {
    return null;
  }

  return (
    <div className={className} data-coach-photo-slot="optional">
      <div
        className={`relative mx-auto overflow-hidden border-2 border-[#52B788]/40 bg-[#0A1628] shadow-lg shadow-black/30 ${roundedClass}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={COACH_PHOTO_PUBLIC_PATH}
          alt="Coach Broc"
          fill
          className="object-cover object-[center_20%]"
          sizes={`${size}px`}
          priority={priority}
        />
      </div>
    </div>
  );
}
