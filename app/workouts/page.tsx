import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasDatabaseTierAccess, type DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

type ProgramCategory = "strength" | "speed";
type PhaseNumber = 1 | 2 | 3;

type PhaseProgram = {
  category: ProgramCategory;
  title: string;
  description: string;
  phase: PhaseNumber;
  pdfUrl: string;
};

type WorkoutGroup = {
  label: string;
  ageKey: "8-11" | "12-15" | "16-18";
  mobilityDescription: string;
  mobilityPdfUrl: string;
  phasePrograms: PhaseProgram[];
};

const workoutGroups: WorkoutGroup[] = [
  {
    label: "Ages 8-11",
    ageKey: "8-11",
    mobilityDescription: "Increase flexibility and joint range for safer athletic movement.",
    mobilityPdfUrl: "/workouts/LCB_Mobility_8-11.pdf",
    phasePrograms: [
      {
        title: "Strength Training",
        description: "Build foundational movement strength with age-appropriate exercises.",
        category: "strength",
        phase: 1,
        pdfUrl: "/workouts/LCB_Strength_8-11_Phase1.pdf",
      },
      {
        title: "Strength Training",
        description: "Build foundational movement strength with age-appropriate exercises.",
        category: "strength",
        phase: 2,
        pdfUrl: "/workouts/LCB_Strength_8-11_Phase2.pdf",
      },
      {
        title: "Strength Training",
        description: "Build foundational movement strength with age-appropriate exercises.",
        category: "strength",
        phase: 3,
        pdfUrl: "/workouts/LCB_Strength_8-11_Phase3.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Improve first-step quickness, coordination, and body control.",
        category: "speed",
        phase: 1,
        pdfUrl: "/workouts/LCB_Speed-Agility_8-11_Phase1.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Improve first-step quickness, coordination, and body control.",
        category: "speed",
        phase: 2,
        pdfUrl: "/workouts/LCB_Speed-Agility_8-11_Phase2.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Improve first-step quickness, coordination, and body control.",
        category: "speed",
        phase: 3,
        pdfUrl: "/workouts/LCB_Speed-Agility_8-11_Phase3.pdf",
      },
    ],
  },
  {
    label: "Ages 12-15",
    ageKey: "12-15",
    mobilityDescription: "Improve movement quality and recovery through targeted mobility work.",
    mobilityPdfUrl: "/workouts/LCB_Mobility_12-15.pdf",
    phasePrograms: [
      {
        title: "Strength Training",
        description: "Develop total-body strength and control for game performance.",
        category: "strength",
        phase: 1,
        pdfUrl: "/workouts/LCB_Strength_12-15_Phase1.pdf",
      },
      {
        title: "Strength Training",
        description: "Develop total-body strength and control for game performance.",
        category: "strength",
        phase: 2,
        pdfUrl: "/workouts/LCB_Strength_12-15_Phase2.pdf",
      },
      {
        title: "Strength Training",
        description: "Develop total-body strength and control for game performance.",
        category: "strength",
        phase: 3,
        pdfUrl: "/workouts/LCB_Strength_12-15_Phase3.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Train acceleration, direction changes, and reaction speed.",
        category: "speed",
        phase: 1,
        pdfUrl: "/workouts/LCB_Speed-Agility_12-15_Phase1.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Train acceleration, direction changes, and reaction speed.",
        category: "speed",
        phase: 2,
        pdfUrl: "/workouts/LCB_Speed-Agility_12-15_Phase2.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Train acceleration, direction changes, and reaction speed.",
        category: "speed",
        phase: 3,
        pdfUrl: "/workouts/LCB_Speed-Agility_12-15_Phase3.pdf",
      },
    ],
  },
  {
    label: "Ages 16-18",
    ageKey: "16-18",
    mobilityDescription: "Maintain hip, shoulder, and spine mobility to support performance.",
    mobilityPdfUrl: "/workouts/LCB_Mobility_16-18.pdf",
    phasePrograms: [
      {
        title: "Strength Training",
        description: "Build game-ready strength, power, and durability across the season.",
        category: "strength",
        phase: 1,
        pdfUrl: "/workouts/LCB_Strength_16-18_Phase1.pdf",
      },
      {
        title: "Strength Training",
        description: "Build game-ready strength, power, and durability across the season.",
        category: "strength",
        phase: 2,
        pdfUrl: "/workouts/LCB_Strength_16-18_Phase2.pdf",
      },
      {
        title: "Strength Training",
        description: "Build game-ready strength, power, and durability across the season.",
        category: "strength",
        phase: 3,
        pdfUrl: "/workouts/LCB_Strength_16-18_Phase3.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Maximize explosiveness and elite movement efficiency on the field.",
        category: "speed",
        phase: 1,
        pdfUrl: "/workouts/LCB_Speed-Agility_16-18_Phase1.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Maximize explosiveness and elite movement efficiency on the field.",
        category: "speed",
        phase: 2,
        pdfUrl: "/workouts/LCB_Speed-Agility_16-18_Phase2.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Maximize explosiveness and elite movement efficiency on the field.",
        category: "speed",
        phase: 3,
        pdfUrl: "/workouts/LCB_Speed-Agility_16-18_Phase3.pdf",
      },
    ],
  },
];

const phaseUnlockDays: Record<PhaseNumber, number> = {
  1: 0,
  2: 30,
  3: 60,
};

const phaseLabels: Record<PhaseNumber, string> = {
  1: "Phase 1 (Weeks 1-4)",
  2: "Phase 2 (Weeks 5-8)",
  3: "Phase 3 (Weeks 9-12)",
};

function formatUnlockDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function WorkoutsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }
  if (isAdminEmail(session.user.email)) {
    redirect("/admin");
  }

  const membershipTier = (session.user.membershipTier ?? "FREE") as DatabaseTier;
  if (!hasDatabaseTierAccess(membershipTier, "basic")) {
    redirect("/upgrade?reason=basic-required");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { signupDate: true },
  });

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">Workout Library</h1>
        <p className="mt-2 text-zinc-300">
          Strength and speed & agility follow progressive phase unlocks. Mobility remains fully
          unlocked at all times.
        </p>
      </section>

      <div className="mt-8 space-y-6 sm:space-y-8">
        {workoutGroups.map((group) => (
          <section
            key={group.label}
            className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6"
          >
            <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">{group.label}</h2>

            {(["strength", "speed"] as const).map((categoryKey) => {
              const categoryPrograms = group.phasePrograms
                .filter((program) => program.category === categoryKey)
                .sort((a, b) => a.phase - b.phase);
              const categoryLabel = categoryKey === "strength" ? "Strength Training" : "Speed & Agility";

              return (
                <div key={`${group.ageKey}-${categoryKey}`} className="mt-5">
                  <h3 className="text-lg font-semibold text-zinc-100">{categoryLabel}</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Progressive 12-week track split into three phases.
                  </p>

                  <div className="mt-3 grid gap-4 md:grid-cols-3">
                    {categoryPrograms.map((program) => {
                      const unlockDate = new Date(user.signupDate);
                      unlockDate.setDate(unlockDate.getDate() + phaseUnlockDays[program.phase]);
                      const isUnlocked =
                        program.phase === 1 || Date.now() >= unlockDate.getTime();

                      if (!isUnlocked) {
                        return (
                          <article
                            key={`${group.label}-${program.title}-phase-${program.phase}`}
                            className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                aria-hidden="true"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-yellow-300/70 bg-yellow-500/10 text-yellow-200"
                              >
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none" stroke="currentColor" strokeWidth="2">
                                  <rect x="5" y="11" width="14" height="10" rx="2" />
                                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                                </svg>
                              </span>
                              <h4 className="text-base font-semibold text-zinc-100">
                                {phaseLabels[program.phase]}
                              </h4>
                            </div>
                            <p className="mt-2 text-sm text-zinc-300">{program.description}</p>
                            <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-100">
                              Unlocks on {formatUnlockDate(unlockDate)}
                            </p>
                          </article>
                        );
                      }

                      return (
                        <article
                          key={`${group.label}-${program.title}-phase-${program.phase}`}
                          className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5"
                        >
                          <h4 className="text-base font-semibold text-zinc-100">
                            {phaseLabels[program.phase]}
                          </h4>
                          <p className="mt-2 text-sm text-zinc-300">{program.description}</p>
                          <Link
                            href={program.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                          >
                            View / Download
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mt-5">
              <h3 className="text-lg font-semibold text-zinc-100">Mobility</h3>
              <p className="mt-1 text-sm text-zinc-400">Always unlocked for active members.</p>
              <article className="mt-3 rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5 md:max-w-md">
                <p className="text-sm text-zinc-300">{group.mobilityDescription}</p>
                <Link
                  href={group.mobilityPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                >
                  View / Download
                </Link>
              </article>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
