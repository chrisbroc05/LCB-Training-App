import WaiverSignForm from "@/components/WaiverSignForm";

type SignPageProps = {
  searchParams: Promise<{ team?: string }>;
};

export default async function SignPage({ searchParams }: SignPageProps) {
  const params = await searchParams;
  const teamName = params.team?.trim() ?? "";

  return <WaiverSignForm initialTeamName={teamName} teamLocked={Boolean(teamName)} />;
}
