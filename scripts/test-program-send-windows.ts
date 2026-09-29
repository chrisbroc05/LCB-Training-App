import { runProgramPushCopySelfTests } from "../lib/program-push-copy";
import { runProgramSendWindowSelfTests } from "../lib/program-schedule-windows";

try {
  const windowCases = runProgramSendWindowSelfTests();
  const pushCopyCases = runProgramPushCopySelfTests();
  console.log(
    `Program scheduler self-tests passed (${windowCases + pushCopyCases} cases: ${windowCases} windows, ${pushCopyCases} push copy).`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
