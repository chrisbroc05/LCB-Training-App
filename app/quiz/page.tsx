import type { Metadata } from "next";
import { Suspense } from "react";
import QuizPageClient from "@/app/quiz/QuizPageClient";
import { metadataForPublicPage } from "@/lib/public-seo";

export const metadata: Metadata = metadataForPublicPage("quiz");

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-black">
      <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-400">Loading...</div>}>
        <QuizPageClient />
      </Suspense>
    </div>
  );
}
