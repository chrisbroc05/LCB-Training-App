export type MemberPdfUnavailableCode =
  | "sign-in"
  | "forbidden"
  | "invalid"
  | "expired"
  | "missing"
  | "error";

export function buildMemberPdfUnavailablePath(code: MemberPdfUnavailableCode): string {
  return `/resources/pdf/unavailable?code=${encodeURIComponent(code)}`;
}

export function memberPdfUnavailableMessage(code: MemberPdfUnavailableCode): string {
  switch (code) {
    case "sign-in":
      return "Sign in to open this PDF, then try again from Resources.";
    case "forbidden":
      return "This PDF is not included with your membership.";
    case "expired":
      return "This download link expired. Go back to the app and tap Open or Download again.";
    case "missing":
      return "We could not find this PDF file. Contact support if this keeps happening.";
    case "invalid":
      return "This link is not valid.";
    default:
      return "Something went wrong opening this PDF.";
  }
}
