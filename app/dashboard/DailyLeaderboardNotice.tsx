import Link from "next/link";
import {
  dailyLeaderboardViewerNoticeCopy,
  type DailyLeaderboardViewerNotice,
} from "@/lib/daily-challenge-shared";

type DailyLeaderboardNoticeProps = {
  notice: DailyLeaderboardViewerNotice;
  className?: string;
};

export default function DailyLeaderboardNotice({
  notice,
  className = "mt-2 text-sm text-zinc-400",
}: DailyLeaderboardNoticeProps) {
  const copy = dailyLeaderboardViewerNoticeCopy(notice);
  if (!copy) {
    return null;
  }

  return (
    <div className={className}>
      <p>{copy.primary}</p>
      {copy.secondary && notice?.kind === "hidden_setting" ? (
        <p className="mt-1">
          <Link href="/settings" className="font-semibold text-[#52B788]">
            {copy.secondary}
          </Link>
        </p>
      ) : copy.secondary ? (
        <p className="mt-1">{copy.secondary}</p>
      ) : null}
    </div>
  );
}
