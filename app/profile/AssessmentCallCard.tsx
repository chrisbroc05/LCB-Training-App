import ProfileCard from "@/app/profile/ProfileCard";
import { profileBodyTextClass, profilePrimaryButtonClass } from "@/app/profile/profile-styles";
import { formatAssessmentCallDateTime } from "@/lib/assessment-call";

type AssessmentCallCardProps = {
  assessmentCallBooked: boolean;
  assessmentCallDate: Date | null;
};

export default function AssessmentCallCard({
  assessmentCallBooked,
  assessmentCallDate,
}: AssessmentCallCardProps) {
  return (
    <ProfileCard title="Assessment Call">
      {assessmentCallBooked && assessmentCallDate ? (
        <div className="space-y-3">
          <p className={profileBodyTextClass}>
            Your assessment call is scheduled for{" "}
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
            Book a free 20-minute video call with Coach Broc to discuss your player&apos;s goals
            and find the right training plan for their development.
          </p>
          <a
            href="https://calendly.com/chrisbroc05/30min"
            target="_blank"
            rel="noopener noreferrer"
            className={profilePrimaryButtonClass}
          >
            Book Your Free Call
          </a>
        </div>
      )}
    </ProfileCard>
  );
}
