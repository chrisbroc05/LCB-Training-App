export function isDrillGrantedToUser(drillId: string, grantedDrillIds: readonly string[]) {
  return grantedDrillIds.includes(drillId);
}
