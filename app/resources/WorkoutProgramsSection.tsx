"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ageGroupDetails,
  ageGroupOptions,
  getProgramsForAgeGroup,
  isAgeGroupKey,
  RESOURCES_AGE_GROUP_STORAGE_KEY,
  type AgeGroupKey,
  type WorkoutProgramCard,
} from "@/lib/workout-programs";

function ResourceActionPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="resources-action-pill"
    >
      {label}
    </Link>
  );
}

function WorkoutProgramCardView({ program }: { program: WorkoutProgramCard }) {
  return (
    <article className="resources-program-card">
      <h3 className="text-base font-bold text-white sm:text-lg">{program.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{program.description}</p>
      <div className="mt-4 border-t border-[#2b3650] pt-4">
        <div className="flex flex-wrap gap-2">
          {program.downloads.map((download) => (
            <ResourceActionPill
              key={`${program.title}-${download.label}-${download.href}`}
              href={download.href}
              label={
                program.layout === "single"
                  ? program.singleActionLabel ?? download.label
                  : download.label
              }
            />
          ))}
        </div>
      </div>
    </article>
  );
}

export default function WorkoutProgramsSection() {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroupKey | null>(null);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(true);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(RESOURCES_AGE_GROUP_STORAGE_KEY);
    if (isAgeGroupKey(storedValue)) {
      setSelectedAgeGroup(storedValue);
    }
    setHasLoadedPreference(true);
  }, []);

  const handleSelectAgeGroup = (ageKey: AgeGroupKey) => {
    if (ageKey === selectedAgeGroup) {
      return;
    }

    if (!selectedAgeGroup) {
      setSelectedAgeGroup(ageKey);
      window.localStorage.setItem(RESOURCES_AGE_GROUP_STORAGE_KEY, ageKey);
      return;
    }

    setCardsVisible(false);
    window.setTimeout(() => {
      setSelectedAgeGroup(ageKey);
      window.localStorage.setItem(RESOURCES_AGE_GROUP_STORAGE_KEY, ageKey);
      window.setTimeout(() => {
        setCardsVisible(true);
      }, 0);
    }, 200);
  };

  const visiblePrograms = selectedAgeGroup ? getProgramsForAgeGroup(selectedAgeGroup) : [];
  const selectedDetails = selectedAgeGroup ? ageGroupDetails[selectedAgeGroup] : null;

  return (
    <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Workout Programs</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Choose your age group to view strength, speed, mobility, and rotational power programs.
      </p>

      <div className="resources-age-pill-row mt-5">
        {ageGroupOptions.map((option) => {
          const isSelected = selectedAgeGroup === option.key;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => handleSelectAgeGroup(option.key)}
              className={`resources-age-pill ${
                isSelected ? "resources-age-pill-selected" : "resources-age-pill-unselected"
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

      {selectedAgeGroup && selectedDetails ? (
        <div
          className={`mt-6 transition-opacity duration-200 ${
            cardsVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <h3 className="text-lg font-bold text-[#52B788] sm:text-xl">{selectedDetails.header}</h3>
          <p className="mt-2 text-sm text-zinc-300">{selectedDetails.description}</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {visiblePrograms.map((program) => (
              <WorkoutProgramCardView key={`${selectedAgeGroup}-${program.title}`} program={program} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
