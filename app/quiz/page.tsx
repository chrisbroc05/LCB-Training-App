import type { Metadata } from "next";
import QuizPageClient from "@/app/quiz/QuizPageClient";
import { PLAYER_IQ_QUIZ_CARD_DESCRIPTION } from "@/lib/player-iq-quiz-shared";
import { getPublicAppUrl } from "@/lib/public-app-url";

const siteUrl = getPublicAppUrl();
const title = "Player IQ Quiz | Coach Broc";
const description = PLAYER_IQ_QUIZ_CARD_DESCRIPTION;
const ogImage = `${siteUrl}/apple-touch-icon.png`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: `${siteUrl}/quiz`,
    siteName: "LCB Training",
    type: "website",
    images: [{ url: ogImage, width: 180, height: 180, alt: "LCB Training" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-black">
      <QuizPageClient />
    </div>
  );
}
