import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasDatabaseTierAccess, type DatabaseTier } from "@/lib/membership";

type WorkoutProgram = {
  title: string;
  description: string;
  pdfUrl: string;
};

type WorkoutAgeGroup = {
  label: string;
  programs: WorkoutProgram[];
};

const workoutGroups: WorkoutAgeGroup[] = [
  {
    label: "Ages 8-11",
    programs: [
      {
        title: "Strength Training",
        description: "Build foundational movement strength with age-appropriate exercises.",
        pdfUrl: "/workouts/LCB_Strength_8-11.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Improve first-step quickness, coordination, and body control.",
        pdfUrl: "/workouts/LCB_Speed-Agility_8-11.pdf",
      },
      {
        title: "Mobility",
        description: "Increase flexibility and joint range for safer athletic movement.",
        pdfUrl: "/workouts/LCB_Mobility_8-11.pdf",
      },
    ],
  },
  {
    label: "Ages 12-15",
    programs: [
      {
        title: "Strength Training",
        description: "Develop total-body strength and control for game performance.",
        pdfUrl: "/workouts/LCB_Strength_12-15.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Train acceleration, direction changes, and reaction speed.",
        pdfUrl: "/workouts/LCB_Speed-Agility_12-15.pdf",
      },
      {
        title: "Mobility",
        description: "Improve movement quality and recovery through targeted mobility work.",
        pdfUrl: "/workouts/LCB_Mobility_12-15.pdf",
      },
    ],
  },
  {
    label: "Ages 16-18",
    programs: [
      {
        title: "Strength Training",
        description: "Build game-ready strength, power, and durability across the season.",
        pdfUrl: "/workouts/LCB_Strength_16-18.pdf",
      },
      {
        title: "Speed & Agility",
        description: "Maximize explosiveness and elite movement efficiency on the field.",
        pdfUrl: "/workouts/LCB_Speed-Agility_16-18.pdf",
      },
      {
        title: "Mobility",
        description: "Maintain hip, shoulder, and spine mobility to support performance.",
        pdfUrl: "/workouts/LCB_Mobility_16-18.pdf",
      },
    ],
  },
];

export default async function WorkoutsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const membershipTier = (session.user.membershipTier ?? "FREE") as DatabaseTier;
  if (!hasDatabaseTierAccess(membershipTier, "basic")) {
    redirect("/upgrade?reason=basic-required");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8">
        <h1 className="text-3xl font-semibold text-zinc-100">Workout Library</h1>
        <p className="mt-2 text-zinc-300">
          Training programs organized by age group. Open each PDF to view or download your workout
          plan.
        </p>
      </section>

      <div className="mt-8 space-y-8">
        {workoutGroups.map((group) => (
          <section
            key={group.label}
            className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6"
          >
            <h2 className="text-2xl font-semibold text-zinc-100">{group.label}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {group.programs.map((program) => (
                <article
                  key={`${group.label}-${program.title}`}
                  className="rounded-xl border border-[#2b3650] bg-black/30 p-5"
                >
                  <h3 className="text-lg font-semibold text-zinc-100">{program.title}</h3>
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
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
