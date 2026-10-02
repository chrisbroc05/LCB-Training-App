export type AccountRole = "PLAYER" | "PARENT";

export type PlayerNameSource = {
  playerFirstName?: string | null;
  playerLastName?: string | null;
  name?: string | null;
  email?: string | null;
};

export function combinePlayerName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function getPlayerFullName(source: PlayerNameSource) {
  const fromParts = combinePlayerName(source.playerFirstName ?? "", source.playerLastName ?? "");
  if (fromParts) {
    return fromParts;
  }

  const legacy = source.name?.trim();
  if (legacy) {
    return legacy;
  }

  return source.email?.trim() || "Player";
}

export function getPlayerFirstName(source: PlayerNameSource) {
  const first = source.playerFirstName?.trim();
  if (first) {
    return first;
  }

  const legacy = source.name?.trim();
  if (legacy) {
    return legacy.split(/\s+/)[0] ?? legacy;
  }

  const emailLocal = source.email?.split("@")[0]?.trim();
  return emailLocal || "Player";
}

export function getAccountHolderFirstName(accountHolderName: string | null | undefined, email: string) {
  const trimmed = accountHolderName?.trim();
  if (trimmed) {
    return trimmed.split(/\s+/)[0] ?? trimmed;
  }

  return email.split("@")[0] || "there";
}

export function formatAccountRoleLabel(accountRole: AccountRole | null | undefined) {
  if (accountRole === "PARENT") {
    return "Parent or guardian";
  }

  return "Player";
}

export function formatSignedUpBy(
  accountRole: AccountRole | null | undefined,
  accountHolderName: string | null | undefined,
) {
  if (accountRole === "PARENT" && accountHolderName?.trim()) {
    return `Signed up by: parent, ${accountHolderName.trim()}`;
  }

  return null;
}

export function normalizePersonName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function namesMatch(left: string, right: string) {
  return normalizePersonName(left) === normalizePersonName(right);
}
