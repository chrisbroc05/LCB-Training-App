import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import ResourceGuideCard from "@/app/resources/ResourceGuideCard";
import { canAccessWorkoutPrograms, type DatabaseTier } from "@/lib/membership";
import { workoutResourceGroups } from "@/lib/workout-resources";
import { getWorkoutPdfUrl } from "@/lib/workouts";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

type ProgramCategory = "strength" | "speed";
type PhaseNumber = 1 | 2 | 3;

type PhaseProgram = {
  category: ProgramCategory;
  title: string;
  description: string;
  phase: PhaseNumber;
  filename: string;
};

type WorkoutGroup = {
  label: string;
  ageKey: "8-11" | "12-15" | "16-18";
  mobilityDescription: string;
  mobilityFilename: string;
  phasePrograms: PhaseProgram[];
};

const strengthPhaseDescriptions: Record<PhaseNumber, string> = {
  1: "Foundation movement patterns, bodyweight strength, and coordination. Introduces basic pushing, pulling, and hinging movements with an emphasis on form over load.",
  2: "Progressive resistance training with light external load. Builds on Phase 1 mechanics and introduces dumbbell and band exercises for upper and lower body strength.",
  3: "Higher intensity strength training with barbells and heavier loads. Focuses on compound movements, progressive overload, and sport-specific power development.",
};

const speedPhaseDescriptions: Record<PhaseNumber, string> = {
  1: "Basic acceleration, deceleration, and change of direction. Introduces footwork patterns and reaction drills using cones and ladders.",
  2: "Intermediate speed mechanics and multi-directional agility. Builds first step quickness and sport-specific movement patterns for baserunning and fielding.",
  3: "Advanced sprint mechanics, explosive first step, and game-speed agility. Focuses on maximum velocity development and elite change of direction.",
};

function getPhaseDescription(category: ProgramCategory, phase: PhaseNumber) {
  return category === "strength"
    ? strengthPhaseDescriptions[phase]
    : speedPhaseDescriptions[phase];
}

const workoutGroups: WorkoutGroup[] = [
  {
    label: "Ages 8-11",
    ageKey: "8-11",
    mobilityDescription: "Increase flexibility and joint range for safer athletic movement.",
    mobilityFilename: "LCB_Mobility_8-11.pdf",
    phasePrograms: [
      {
        title: "Strength Training",
        description: getPhaseDescription("strength", 1),
        category: "strength",
        phase: 1,
        filename: "LCB_Strength_8-11_Phase1.pdf",
      },
      {
        title: "Strength Training",
        description: getPhaseDescription("strength", 2),
        category: "strength",
        phase: 2,
        filename: "LCB_Strength_8-11_Phase2.pdf",
      },
      {
        title: "Strength Training",
        description: getPhaseDescription("strength", 3),
        category: "strength",
        phase: 3,
        filename: "LCB_Strength_8-11_Phase3.pdf",
      },
      {
        title: "Speed & Agility",
        description: getPhaseDescription("speed", 1),
        category: "speed",
        phase: 1,
        filename: "LCB_Speed-Agility_8-11_Phase1.pdf",
      },
      {
        title: "Speed & Agility",
        description: getPhaseDescription("speed", 2),
        category: "speed",
        phase: 2,
        filename: "LCB_Speed-Agility_8-11_Phase2.pdf",
      },
      {
        title: "Speed & Agility",
        description: getPhaseDescription("speed", 3),
        category: "speed",
        phase: 3,
        filename: "LCB_Speed-Agility_8-11_Phase3.pdf",
      },
    ],
  },
  {
    label: "Ages 12-15",
    ageKey: "12-15",
    mobilityDescription: "Improve movement quality and recovery through targeted mobility work.",
    mobilityFilename: "LCB_Mobility_12-15.pdf",
    phasePrograms: [
      {
        title: "Strength Training",
        description: getPhaseDescription("strength", 1),
        category: "strength",
        phase: 1,
        filename: "LCB_Strength_12-15_Phase1.pdf",
      },
      {
        title: "Strength Training",
        description: getPhaseDescription("strength", 2),
        category: "strength",
        phase: 2,
        filename: "LCB_Strength_12-15_Phase2.pdf",
      },
      {
        title: "Strength Training",
        description: getPhaseDescription("strength", 3),
        category: "strength",
        phase: 3,
        filename: "LCB_Strength_12-15_Phase3.pdf",
      },
      {
        title: "Speed & Agility",
        description: getPhaseDescription("speed", 1),
        category: "speed",
        phase: 1,
        filename: "LCB_Speed-Agility_12-15_Phase1.pdf",
      },
      {
        title: "Speed & Agility",
        description: getPhaseDescription("speed", 2),
        category: "speed",
        phase: 2,
        filename: "LCB_Speed-Agility_12-15_Phase2.pdf",
      },
      {
        title: "Speed & Agility",
        description: getPhaseDescription("speed", 3),
        category: "speed",
        phase: 3,
        filename: "LCB_Speed-Agility_12-15_Phase3.pdf",
      },
    ],
  },
  {
    label: "Ages 16-18",
    ageKey: "16-18",
    mobilityDescription: "Maintain hip, shoulder, and spine mobility to support performance.",
    mobilityFilename: "LCB_Mobility_16-18.pdf",
    phasePrograms: [
      {
        title: "Strength Training",
        description: getPhaseDescription("strength", 1),
        category: "strength",
        phase: 1,
        filename: "LCB_Strength_16-18_Phase1.pdf",
      },
      {
        title: "Strength Training",
        description: getPhaseDescription("strength", 2),
        category: "strength",
        phase: 2,
        filename: "LCB_Strength_16-18_Phase2.pdf",
      },
      {
        title: "Strength Training",
        description: getPhaseDescription("strength", 3),
        category: "strength",
        phase: 3,
        filename: "LCB_Strength_16-18_Phase3.pdf",
      },
      {
        title: "Speed & Agility",
        description: getPhaseDescription("speed", 1),
        category: "speed",
        phase: 1,
        filename: "LCB_Speed-Agility_16-18_Phase1.pdf",
      },
      {
        title: "Speed & Agility",
        description: getPhaseDescription("speed", 2),
        category: "speed",
        phase: 2,
        filename: "LCB_Speed-Agility_16-18_Phase2.pdf",
      },
      {
        title: "Speed & Agility",
        description: getPhaseDescription("speed", 3),
        category: "speed",
        phase: 3,
        filename: "LCB_Speed-Agility_16-18_Phase3.pdf",
      },
    ],
  },
];

const phaseLabels: Record<PhaseNumber, string> = {
  1: "Phase 1 (Weeks 1-4)",
  2: "Phase 2 (Weeks 5-8)",
  3: "Phase 3 (Weeks 9-12)",
};

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }
  if (isAdminEmail(session.user.email)) {
    redirect("/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true },
  });

  if (!user) {
    redirect("/auth");
  }

  const membershipTier = (user.membershipTier ?? "FREE") as DatabaseTier;
  if (!canAccessWorkoutPrograms(membershipTier)) {
    return (
      <LockedFeaturePanel
        title="Resources"
        description="Download workout programs and bonus guides tailored to your membership tier."
        message="Resources are available on Basic, Memorable, and Elite memberships. Upgrade to Basic or above to unlock all 7 downloadable workout programs."
        upgradeLabel="Upgrade to Basic or Above"
        upgradeHref="/upgrade?reason=basic-required"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">Resources</h1>
        <p className="mt-2 text-zinc-300">
          Download workout programs and bonus guides included with your membership tier.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Workout Programs</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Strength, speed, and mobility programs organized by age group.
        </p>

        <div className="mt-6 space-y-6 sm:space-y-8">
          {workoutGroups.map((group) => (
            <div
              key={group.label}
              className="rounded-xl border border-[#2b3650] bg-black/20 p-4 sm:p-5"
            >
              <h3 className="text-lg font-semibold text-zinc-100 sm:text-xl">{group.label}</h3>

              {(["strength", "speed"] as const).map((categoryKey) => {
                const categoryPrograms = group.phasePrograms
                  .filter((program) => program.category === categoryKey)
                  .sort((a, b) => a.phase - b.phase);
                const categoryLabel =
                  categoryKey === "strength" ? "Strength Training" : "Speed & Agility";

                return (
                  <div key={`${group.ageKey}-${categoryKey}`} className="mt-5">
                    <h4 className="text-base font-semibold text-zinc-100">{categoryLabel}</h4>
                    <p className="mt-1 text-sm text-zinc-400">
                      Progressive 12-week track split into three phases.
                    </p>

                    <div className="mt-3 grid gap-4 md:grid-cols-3">
                      {categoryPrograms.map((program) => (
                        <article
                          key={`${group.label}-${program.title}-phase-${program.phase}`}
                          className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5"
                        >
                          <h5 className="text-base font-semibold text-zinc-100">
                            {phaseLabels[program.phase]}
                          </h5>
                          <p className="mt-2 text-sm text-zinc-300">{program.description}</p>
                          <Link
                            href={getWorkoutPdfUrl(program.filename)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                          >
                            Download
                          </Link>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="mt-5">
                <h4 className="text-base font-semibold text-zinc-100">Mobility</h4>
                <p className="mt-1 text-sm text-zinc-400">Always unlocked for active members.</p>
                <article className="mt-3 rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5 md:max-w-md">
                  <p className="text-sm text-zinc-300">{group.mobilityDescription}</p>
                  <Link
                    href={getWorkoutPdfUrl(group.mobilityFilename)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                  >
                    Download
                  </Link>
                </article>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Guides &amp; Resources</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Bonus PDFs unlocked based on your membership tier.
        </p>

        <div className="mt-6 space-y-6">
          {workoutResourceGroups.map((group) => (
            <div key={group.heading}>
              <h3 className="text-lg font-semibold text-zinc-100">{group.heading}</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {group.resources.map((resource) => (
                  <ResourceGuideCard
                    key={resource.filename}
                    resource={resource}
                    membershipTier={membershipTier}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
