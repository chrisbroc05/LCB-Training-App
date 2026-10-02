import ProfileCard from "@/app/profile/ProfileCard";
import { profileBodyTextClass, profilePrimaryButtonClass } from "@/app/profile/profile-styles";
import { formatAssessmentCallDateTime } from "@/lib/assessment-call";
import { COACH_CALENDLY_URL } from "@/lib/coach-calendly-shared";

type AssessmentCallCardProps = {
  assessmentCallBooked: boolean;
  assessmentCallDate: Date | null;
};

export default function AssessmentCallCard({
  assessmentCallBooked,
  assessmentCallDate,
}: AssessmentCallCardProps) {
  return (
    <ProfileCard title="Coach Call">
      {assessmentCallBooked && assessmentCallDate ? (
        <div className="space-y-3">
          <p className={profileBodyTextClass}>
            Your call is scheduled for{" "}
            <span className="font-semibold text-[#9df3bd]">
              {formatAssessmentCallDateTime(assessmentCallDate)}
            </span>
          </p>
          <p className="text-xs text-zinc-400">
            Google Meet link will be in your Calendly confirmation email
          </p>
          <p className="text-xs text-zinc-400">
            Need to reschedule or cancel? Use the link provided in your Calendly confirmation
            email
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className={profileBodyTextClass}>
            Want to talk through the 12-Week Program first? Book a call with me.
          </p>
          <a
            href={COACH_CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={profilePrimaryButtonClass}
          >
            Book a call
          </a>
        </div>
      )}
    </ProfileCard>
  );
}
