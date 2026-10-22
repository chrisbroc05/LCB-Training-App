"use client";

import Link from "next/link";
import FixItVimeoEmbed from "@/app/fix-it/FixItVimeoEmbed";
import type { FixItPlanGenerated } from "@/lib/fix-it-plans-data.generated";
import { FIX_IT_PLANS_META } from "@/lib/fix-it-plans-shared";

type FixItPlanPageClientProps = {
  plan: FixItPlanGenerated;
  accessToken: string | null;
};

function SectionBlock({ title, body }: { title: string; body: string }) {
  if (!body.trim()) {
    return null;
  }
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
        {body}
      </div>
    </section>
  );
}

export default function FixItPlanPageClient({ plan, accessToken }: FixItPlanPageClientProps) {
  const pdfHref = accessToken
    ? `/api/fix-it/download?resource=${encodeURIComponent(plan.resourceSlug)}&token=${encodeURIComponent(accessToken)}`
    : `/api/fix-it/download?resource=${encodeURIComponent(plan.resourceSlug)}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">Fix-It Hitting Plan</p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight text-white">{plan.title}</h1>
      <p className="mt-2 text-base text-zinc-400">{plan.subtitle}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={pdfHref}
          className="inline-flex min-h-[48px] items-center rounded-full bg-[#2D6A4F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#52B788]"
        >
          Download PDF
        </a>
        <Link
          href="/fix-it"
          className="inline-flex min-h-[48px] items-center rounded-full border border-[#2b3650] px-5 py-3 text-sm font-semibold text-zinc-200 hover:border-[#52B788]"
        >
          All Fix-It plans
        </Link>
      </div>

      <SectionBlock title="The problem" body={plan.problem} />
      <SectionBlock title="The fix" body={plan.fix} />

      {plan.fixedLooksLike.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">What fixed looks like</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
            {plan.fixedLooksLike.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {plan.introVideoTitle ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">Intro video</h2>
          <p className="mt-1 text-sm text-zinc-400">{plan.introVideoTitle}</p>
          <div className="mt-4">
            <FixItVimeoEmbed videoTitle={plan.introVideoTitle} />
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Drills</h2>
        <div className="mt-4 space-y-8">
          {plan.drills.map((drill) => (
              <div key={drill.order} className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#52B788]">
                  Drill {drill.order}
                </p>
                <h3 className="mt-2 text-base font-semibold text-white">{drill.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{drill.description}</p>
                {drill.videoTitle ? (
                  <div className="mt-4">
                    <FixItVimeoEmbed videoTitle={drill.videoTitle} />
                  </div>
                ) : null}
              </div>
            ))}
        </div>
      </section>

      {plan.bonusVideos.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">
            {plan.bonusVideos.length === 1 ? "Bonus video" : "Bonus videos"}
          </h2>
          <div className="mt-4 space-y-8">
            {plan.bonusVideos.map((bonus) => (
              <div
                key={bonus.title}
                className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-5"
              >
                <h3 className="text-base font-semibold text-white">{bonus.title}</h3>
                {bonus.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{bonus.description}</p>
                ) : null}
                <div className="mt-4">
                  <FixItVimeoEmbed videoTitle={bonus.title} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <SectionBlock title="Baseline test" body={plan.baselineTest} />
      <SectionBlock title="Week 1: FEEL IT" body={plan.week1} />
      <SectionBlock title="Week 2: BUILD IT" body={plan.week2} />
      <SectionBlock title="Week 3: COMPETE WITH IT" body={plan.week3} />

      {plan.mindsetWeek3Title ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">Week 3 mindset video</h2>
          <p className="mt-1 text-sm text-zinc-400">{plan.mindsetWeek3Title}</p>
          <div className="mt-4">
            <FixItVimeoEmbed videoTitle={plan.mindsetWeek3Title} />
          </div>
        </section>
      ) : null}

      <SectionBlock title="What's next" body={plan.whatsNext} />

      <p className="mt-10 border-t border-[#18243a] pt-6 text-sm leading-relaxed text-zinc-500">
        {FIX_IT_PLANS_META.scheduleNote}
      </p>
    </div>
  );
}
