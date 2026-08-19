"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ageGroupOptions,
  getProgramsForAgeGroup,
  isAgeGroupKey,
  RESOURCES_AGE_GROUP_STORAGE_KEY,
  type AgeGroupKey,
  type WorkoutProgramCard,
} from "@/lib/workout-programs";

function WorkoutProgramDownloadCard({ program }: { program: WorkoutProgramCard }) {
  const [primaryDownload, ...additionalDownloads] = program.downloads;

  return (
    <article className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5">
      <h3 className="text-base font-semibold text-zinc-100 sm:text-lg">{program.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{program.description}</p>
      {primaryDownload ? (
        <Link
          href={primaryDownload.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Download
        </Link>
      ) : null}
      {additionalDownloads.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {additionalDownloads.map((download) => (
            <Link
              key={`${program.title}-${download.label}-${download.href}`}
              href={download.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#98b144] transition hover:text-[#b5d84f]"
            >
              Download {download.label}
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function WorkoutProgramsSection() {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroupKey | null>(null);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(RESOURCES_AGE_GROUP_STORAGE_KEY);
    if (isAgeGroupKey(storedValue)) {
      setSelectedAgeGroup(storedValue);
    }
    setHasLoadedPreference(true);
  }, []);

  const handleSelectAgeGroup = (ageKey: AgeGroupKey) => {
    setSelectedAgeGroup(ageKey);
    window.localStorage.setItem(RESOURCES_AGE_GROUP_STORAGE_KEY, ageKey);
  };

  const visiblePrograms = selectedAgeGroup ? getProgramsForAgeGroup(selectedAgeGroup) : [];

  return (
    <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Workout Programs</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Choose your age group to view strength, speed, mobility, and rotational power programs.
      </p>

      <div className="mobile-filter-row mt-5">
        {ageGroupOptions.map((option) => {
          const isSelected = selectedAgeGroup === option.key;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => handleSelectAgeGroup(option.key)}
              className={`mobile-filter-pill ${
                isSelected
                  ? "border-[#52B788] bg-[#52B788] text-[#0A1628]"
                  : "border-[#2b3650] bg-transparent text-zinc-400"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {hasLoadedPreference && !selectedAgeGroup ? (
        <p className="mt-6 rounded-xl border border-dashed border-[#2b3650] bg-black/20 px-4 py-8 text-center text-sm text-zinc-400">
          Select your age group to see your programs
        </p>
      ) : null}

      {selectedAgeGroup ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {visiblePrograms.map((program) => (
            <WorkoutProgramDownloadCard key={program.title} program={program} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
