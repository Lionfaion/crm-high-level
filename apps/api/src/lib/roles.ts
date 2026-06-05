export enum Role {
  SUPER_ADMIN   = "SUPER_ADMIN",
  AGENCY_ADMIN  = "AGENCY_ADMIN",
  AGENCY_USER   = "AGENCY_USER",
  ACCOUNT_ADMIN = "ACCOUNT_ADMIN",
  ACCOUNT_USER  = "ACCOUNT_USER",
}

// Numeric weight — higher = more privileged
const ROLE_WEIGHT: Record<Role, number> = {
  [Role.SUPER_ADMIN]:   50,
  [Role.AGENCY_ADMIN]:  40,
  [Role.AGENCY_USER]:   30,
  [Role.ACCOUNT_ADMIN]: 20,
  [Role.ACCOUNT_USER]:  10,
};

/** Returns true when `actor` has at least the privileges of `required`. */
export function hasRole(actor: string, required: Role): boolean {
  const actorWeight   = ROLE_WEIGHT[actor as Role] ?? 0;
  const requiredWeight = ROLE_WEIGHT[required];
  return actorWeight >= requiredWeight;
}

/** Returns true when `actor` is exactly one of the listed roles. */
export function isOneOf(actor: string, roles: Role[]): boolean {
  return roles.includes(actor as Role);
}
