import "dotenv/config";
import { assertSafeLocalDevelopmentEnvironment } from "../lib/dev-environment-guard-shared";

process.env.AUTH_TRUST_HOST = "true";

assertSafeLocalDevelopmentEnvironment();
console.log("Local dev environment checks passed.");
