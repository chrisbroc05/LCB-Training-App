import "server-only";

import { getCompanyMailingAddress } from "@/lib/email-layout";

export function isCompanyMailingAddressConfigured(): boolean {
  return Boolean(getCompanyMailingAddress());
}

export class MarketingEmailBlockedError extends Error {
  readonly code = "MARKETING_BLOCKED_MISSING_MAILING_ADDRESS" as const;

  constructor() {
    super("COMPANY_MAILING_ADDRESS is not set. Marketing emails are blocked.");
    this.name = "MarketingEmailBlockedError";
  }
}

export function assertCompanyMailingAddressForMarketing() {
  if (!isCompanyMailingAddressConfigured()) {
    throw new MarketingEmailBlockedError();
  }
}
