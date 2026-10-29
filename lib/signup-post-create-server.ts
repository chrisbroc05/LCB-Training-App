import "server-only";

export function runSignupBackgroundTask(
  userId: string,
  taskName: string,
  task: () => Promise<void>,
) {
  void (async () => {
    try {
      await task();
    } catch (error) {
      console.error(`Signup background task failed [${taskName}] userId=${userId}`, error);
    }
  })();
}
