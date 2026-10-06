import StorySlide from "@/app/admin/social/app-highlight/StorySlide";
import PhoneFrame from "@/app/admin/social/app-highlight/PhoneFrame";
import DemoTodayScreen from "@/app/admin/social/app-highlight/mockups/DemoTodayScreen";
import DemoFocusCard from "@/app/admin/social/app-highlight/mockups/DemoFocusCard";
import DemoBreakdownView from "@/app/admin/social/app-highlight/mockups/DemoBreakdownView";
import DemoChatScreen from "@/app/admin/social/app-highlight/mockups/DemoChatScreen";
import DemoWorkoutScreen from "@/app/admin/social/app-highlight/mockups/DemoWorkoutScreen";
import DemoStatsScreen from "@/app/admin/social/app-highlight/mockups/DemoStatsScreen";
import DemoPushNotification from "@/app/admin/social/app-highlight/mockups/DemoPushNotification";
import DemoParentRecapEmail from "@/app/admin/social/app-highlight/mockups/DemoParentRecapEmail";
import DemoSwingCompare from "@/app/admin/social/app-highlight/mockups/DemoSwingCompare";
import { BRAND_PRIMARY_SLOGAN } from "@/lib/brand-copy";

type AppHighlightSlidesProps = {
  parentRecapHtml: string;
};

export default function AppHighlightSlides({ parentRecapHtml }: AppHighlightSlidesProps) {
  return (
    <div id="app-highlight-slides" className="flex flex-col items-center gap-10 bg-[#050b16] py-10">
      <StorySlide
        index={1}
        headline="Lessons are one day a week."
        supporting="What happens the other six?"
      />

      <StorySlide
        index={2}
        headline="Your plan. Every day."
        supporting={
          <>
            Built around you. 30 to 60 minutes of
            <br />
            personalized development.
          </>
        }
      >
        <PhoneFrame title="Today">
          <DemoTodayScreen />
        </PhoneFrame>
      </StorySlide>

      <StorySlide
        index={3}
        headline="I set your focus."
        supporting="Every week, with the drills to fix it."
      >
        <PhoneFrame title="Today">
          <DemoFocusCard />
        </PhoneFrame>
      </StorySlide>

      <StorySlide
        index={4}
        headline="Weekly breakdowns."
        supporting="Send me a video. I break it down."
      >
        <PhoneFrame title="Coaching">
          <DemoBreakdownView />
        </PhoneFrame>
      </StorySlide>

      <StorySlide
        index={5}
        headline="Message me anytime."
        supporting="Full access. I'm here whenever you need me."
      >
        <PhoneFrame title="Messages">
          <DemoChatScreen />
        </PhoneFrame>
      </StorySlide>

      <StorySlide
        index={6}
        headline="Train anywhere."
        supporting="Gym, dumbbells, or just your stairs."
      >
        <PhoneFrame title="Workout">
          <DemoWorkoutScreen />
        </PhoneFrame>
      </StorySlide>

      <StorySlide
        index={7}
        headline="Games count."
        supporting="Log your games and stats. I see it all."
      >
        <PhoneFrame title="Stats">
          <DemoStatsScreen />
        </PhoneFrame>
      </StorySlide>

      <StorySlide
        index={8}
        headline="Never miss a day."
        supporting="Reminders when your work is ready."
      >
        <PhoneFrame title="Lock screen">
          <DemoPushNotification />
        </PhoneFrame>
      </StorySlide>

      <StorySlide
        index={9}
        headline="Parents stay in the loop."
        supporting="Weekly recap emails."
      >
        <PhoneFrame title="Email">
          <DemoParentRecapEmail html={parentRecapHtml} />
        </PhoneFrame>
      </StorySlide>

      <StorySlide
        index={10}
        headline="Week 1 vs Week 12."
        supporting="See how far your swing came."
      >
        <PhoneFrame title="Progress">
          <DemoSwingCompare />
        </PhoneFrame>
      </StorySlide>

      <StorySlide
        index={11}
        headline="12-Week Coaching Program"
        supporting="$599. Comment SWING for a free breakdown or tap the link in my bio."
        footerTagline={BRAND_PRIMARY_SLOGAN}
      />
    </div>
  );
}
