type MemberProfileCardProps = {
  profile: {
    hasProfile: boolean;
    position: string | null;
    age: number | null;
    graduationYear: number | null;
    currentTeam: string | null;
    level: string | null;
    playerBio: string | null;
  };
};

export default function MemberProfileCard({ profile }: MemberProfileCardProps) {
  if (!profile.hasProfile) {
    return (
      <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
        <p className="text-sm font-semibold text-zinc-100">Player Profile</p>
        <p className="mt-2 text-sm text-zinc-400">
          Member has not completed their player profile yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
      <p className="text-sm font-semibold text-zinc-100">Player Profile</p>
      <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
        {profile.position ? (
          <p>
            <span className="font-semibold text-zinc-100">Position:</span> {profile.position}
          </p>
        ) : null}
        {profile.age ? (
          <p>
            <span className="font-semibold text-zinc-100">Age:</span> {profile.age}
          </p>
        ) : null}
        {profile.graduationYear ? (
          <p>
            <span className="font-semibold text-zinc-100">Graduation year:</span>{" "}
            {profile.graduationYear}
          </p>
        ) : null}
        {profile.currentTeam ? (
          <p>
            <span className="font-semibold text-zinc-100">Current team:</span> {profile.currentTeam}
          </p>
        ) : null}
        {profile.level ? (
          <p>
            <span className="font-semibold text-zinc-100">Level:</span> {profile.level}
          </p>
        ) : null}
      </div>
      {profile.playerBio ? (
        <div className="mt-3">
          <p className="text-sm font-semibold text-zinc-100">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">{profile.playerBio}</p>
        </div>
      ) : null}
    </div>
  );
}
