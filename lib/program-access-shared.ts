import {
  hasPersonalProgramDashboard,
  type AccessUserFields,
  usesFixedTwelveWeekProgram,
} from "@/lib/access-shared";

export function canAccessProgramDashboard(user: AccessUserFields): boolean {
  return hasPersonalProgramDashboard(user);
}

export function canAccessFixedTwelveWeekProgramFeatures(user: AccessUserFields): boolean {
  return usesFixedTwelveWeekProgram(user);
}
