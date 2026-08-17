import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const reflections = await prisma.playbookReflection.findMany({
    where: {
      sharedWithCoach: true,
      answer: { not: null },
    },
    orderBy: [{ sharedAt: "desc" }, { updatedAt: "desc" }],
    include: {
      chapter: {
        include: {
          progress: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  membershipTier: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const grouped = new Map<
    string,
    {
      userId: string;
      memberName: string;
      memberEmail: string;
      membershipTier: string;
      chapters: Array<{
        chapterNumber: number;
        chapterTitle: string;
        sharedAt: string | null;
        reflections: Array<{
          questionNumber: number;
          questionText: string;
          answer: string | null;
        }>;
      }>;
      latestSharedAt: string | null;
    }
  >();

  for (const reflection of reflections) {
    const user = reflection.chapter.progress.user;
    const chapterNumber = reflection.chapter.chapterNumber;
    const sharedAt = reflection.sharedAt?.toISOString() ?? null;

    if (!grouped.has(user.id)) {
      grouped.set(user.id, {
        userId: user.id,
        memberName: user.name ?? "Member",
        memberEmail: user.email,
        membershipTier: user.membershipTier,
        chapters: [],
        latestSharedAt: sharedAt,
      });
    }

    const memberEntry = grouped.get(user.id)!;
    if (sharedAt && (!memberEntry.latestSharedAt || sharedAt > memberEntry.latestSharedAt)) {
      memberEntry.latestSharedAt = sharedAt;
    }

    let chapterEntry = memberEntry.chapters.find((item) => item.chapterNumber === chapterNumber);
    if (!chapterEntry) {
      chapterEntry = {
        chapterNumber,
        chapterTitle: reflection.chapter.chapterTitle,
        sharedAt,
        reflections: [],
      };
      memberEntry.chapters.push(chapterEntry);
    }

    if (sharedAt && (!chapterEntry.sharedAt || sharedAt > chapterEntry.sharedAt)) {
      chapterEntry.sharedAt = sharedAt;
    }

    chapterEntry.reflections.push({
      questionNumber: reflection.questionNumber,
      questionText: reflection.questionText,
      answer: reflection.answer,
    });
  }

  const members = Array.from(grouped.values())
    .map((member) => ({
      ...member,
      chapters: member.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber),
    }))
    .sort((a, b) => {
      const aTime = a.latestSharedAt ? new Date(a.latestSharedAt).getTime() : 0;
      const bTime = b.latestSharedAt ? new Date(b.latestSharedAt).getTime() : 0;
      return bTime - aTime;
    });

  return NextResponse.json({ members });
}
