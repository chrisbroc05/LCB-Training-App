export async function register() {
  if (process.env.NODE_ENV === "development") {
    const { assertSafeLocalDevelopmentEnvironment } = await import(
      "@/lib/dev-environment-guard-shared"
    );
    assertSafeLocalDevelopmentEnvironment();
  }
}
