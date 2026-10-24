import "dotenv/config";
import { listUnattachedAdminResponseVideos } from "../lib/admin-unattached-response-videos-server";

const daysArg = process.argv[2] ?? "1";
const days = Number(daysArg);
const since =
  Number.isFinite(days) && days > 0
    ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    : undefined;

async function main() {
  const videos = await listUnattachedAdminResponseVideos({ since });

  console.log(
    JSON.stringify(
      {
        since: since?.toISOString() ?? null,
        count: videos.length,
        videos,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
