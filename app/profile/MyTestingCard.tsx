"use client";

import { useState } from "react";
import ProfileCard from "@/app/profile/ProfileCard";
import {
  profileBodyTextClass,
  profileMutedTextClass,
  profileSecondaryButtonClass,
} from "@/app/profile/profile-styles";
import { formatMetricValue, type TestMetricInputType } from "@/lib/testing-shared";

type MyTestingMetric = {
  key: string;
  label: string;
  unit: string;
  decimals: number;
  inputType: TestMetricInputType;
  latest: { best: number | null; date: string; label: string } | null;
  personalBest: { best: number; sessionDate: string; sessionLabel: string } | null;
  history: Array<{ date: string; label: string; best: number | null }>;
};

export type MyTestingCardData = {
  player: { id: string; firstName: string; lastName: string };
  teams: Array<{ id: string; name: string; season: string }>;
  metrics: MyTestingMetric[];
  hasHistory: boolean;
};

type MyTestingCardProps = {
  data: MyTestingCardData;
};

export default function MyTestingCard({ data }: MyTestingCardProps) {
  const [showHistory, setShowHistory] = useState(false);

  if (data.metrics.length === 0) {
    return (
      <ProfileCard
        title="My Testing"
        description="Your testing results will show here after Coach enters them and links your account."
      />
    );
  }

  return (
    <ProfileCard
      title="My Testing"
      description="Your latest testing numbers. Only you (and a parent on this account) can see these."
    >
      <div className="space-y-3">
        {data.metrics.map((metric) => {
          const latest = metric.latest;
          const value = latest?.best ?? metric.personalBest?.best ?? null;
          const date = latest?.date ?? metric.personalBest?.sessionDate ?? null;
          return (
            <div
              key={metric.key}
              className="rounded-xl border border-[#2b3650] bg-black/20 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{metric.label}</p>
                  {date ? <p className={profileMutedTextClass}>Tested {date}</p> : null}
                </div>
                <p className="text-sm font-semibold text-[#52B788]">
                  {formatMetricValue(
                    {
                      decimals: metric.decimals,
                      unit: metric.unit,
                      inputType: metric.inputType,
                    },
                    value,
                  )}
                </p>
              </div>
              {showHistory && metric.history.length > 1 ? (
                <ul className="mt-3 space-y-1 border-t border-[#1c2740] pt-3">
                  {[...metric.history].reverse().map((point, index) => (
                    <li
                      key={`${metric.key}-${point.date}-${index}`}
                      className={`flex justify-between gap-3 ${profileBodyTextClass}`}
                    >
                      <span>{point.date}</span>
                      <span>
                        {formatMetricValue(
                          {
                            decimals: metric.decimals,
                            unit: metric.unit,
                            inputType: metric.inputType,
                          },
                          point.best,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      {data.hasHistory ? (
        <button
          type="button"
          onClick={() => setShowHistory((current) => !current)}
          className={`mt-4 ${profileSecondaryButtonClass}`}
        >
          {showHistory ? "Hide history" : "Show history"}
        </button>
      ) : null}
    </ProfileCard>
  );
}
