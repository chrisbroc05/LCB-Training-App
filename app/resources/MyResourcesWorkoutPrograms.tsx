"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MyResourceProgramCardModel, MyResourceWorkoutProgramsSection } from "@/lib/my-resources-shared";
import { MY_RESOURCES_AGE_GROUPS } from "@/lib/my-resources-catalog-shared";
import type { AgeGroupKey } from "@/lib/workout-programs";

const AGE_PILLS = MY_RESOURCES_AGE_GROUPS.map((age) => ({
  key: age.key,
  label: age.key === "16-18" ? "16+" : age.key,
}));

type MyResourcesWorkoutProgramsProps = {
  section: MyResourceWorkoutProgramsSection;
};

function ProgramCard(props: {
  program: MyResourceProgramCardModel;
  selectedAge: AgeGroupKey;
  onSelectAge: (age: AgeGroupKey) => void;
  showAgePills: boolean;
}) {
  const { program, selectedAge, onSelectAge, showAgePills } = props;
  const actions =
    program.key === "rotational"
      ? program.actionsByAge.all ?? []
      : program.actionsByAge[selectedAge] ?? [];

  return (
    <article className="resources-program-card">
      <h3 className="text-lg font-bold text-white">{program.title}</h3>
      <p className="mt-2 text-sm leading-snug text-zinc-400">{program.description}</p>

      {showAgePills ? (
        <div className="resources-age-pill-row mt-4">
          {AGE_PILLS.map((pill) => {
            const isSelected = selectedAge === pill.key;
            return (
              <button
                key={`${program.key}-${pill.key}`}
                type="button"
                onClick={() => onSelectAge(pill.key)}
                className={`resources-age-pill ${
                  isSelected ? "resources-age-pill-selected" : "resources-age-pill-unselected"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {program.layout === "phases"
          ? actions.map((action) => (
              <Link
                key={`${program.key}-${action.label}`}
                href={action.viewerHref}
                className="resources-action-pill w-full justify-center sm:w-auto"
              >
                {action.label}
              </Link>
            ))
          : actions.map((action) => (
              <Link
                key={`${program.key}-${action.label}`}
                href={action.viewerHref}
                className="resources-action-pill w-full justify-center sm:w-auto"
              >
                {program.singleActionLabel ?? action.label}
              </Link>
            ))}
      </div>
    </article>
  );
}

export default function MyResourcesWorkoutPrograms({ section }: MyResourcesWorkoutProgramsProps) {
  const initialAge = section.defaultAgeGroup ?? AGE_PILLS[0]?.key ?? "8-11";
  const [ageByProgram, setAgeByProgram] = useState<Record<string, AgeGroupKey>>({});

  const programs = useMemo(() => section.programs, [section.programs]);

  const getAgeForProgram = (programKey: string) => ageByProgram[programKey] ?? initialAge;

  return (
    <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-zinc-100">{section.title}</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {programs.map((program) => (
          <ProgramCard
            key={program.key}
            program={program}
            selectedAge={getAgeForProgram(program.key)}
            onSelectAge={(age) =>
              setAgeByProgram((current) => ({
                ...current,
                [program.key]: age,
              }))
            }
            showAgePills={program.key !== "rotational"}
          />
        ))}
      </div>
    </section>
  );
}
