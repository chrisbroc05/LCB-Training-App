import type { ResourceDownloadTokenPayload } from "@/lib/resource-download-token-shared";

export type ResourceDownloadGateKind = "allow" | "invalid" | "refunded" | "not_authorized";

export const RESOURCE_DOWNLOAD_REFUNDED_HEADLINE =
  "This purchase was refunded, so the download is no longer available.";

export const RESOURCE_DOWNLOAD_INVALID_HEADLINE =
  "This link has expired or isn't valid.";

export const PURCHASE_LINK_RECOVERY_CONFIRMATION =
  "If that email has this plan, your link is on the way.";

export function classifyPaidResourceDownload(params: {
  payload: ResourceDownloadTokenPayload | null;
  tokenAccepted: boolean;
  purchaseRefunded: boolean;
  purchaseActive: boolean;
}): ResourceDownloadGateKind {
  if (!params.tokenAccepted || !params.payload) {
    return "invalid";
  }
  if (params.purchaseRefunded) {
    return "refunded";
  }
  if (!params.purchaseActive) {
    return "not_authorized";
  }
  return "allow";
}

/** Token email alone authorizes download; session userId must not override or block. */
export function shouldAuthorizePaidDownloadViaTokenEmail(params: {
  tokenEmail: string;
  tokenEmailHasActivePurchase: boolean;
}): boolean {
  return params.tokenEmailHasActivePurchase;
}
