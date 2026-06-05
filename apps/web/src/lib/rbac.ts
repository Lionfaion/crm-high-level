export type UserRole =
  | "SUPER_ADMIN"
  | "AGENCY_ADMIN"
  | "AGENCY_USER"
  | "ACCOUNT_ADMIN"
  | "ACCOUNT_USER";

const ROLE_WEIGHT: Record<UserRole, number> = {
  SUPER_ADMIN:   50,
  AGENCY_ADMIN:  40,
  AGENCY_USER:   30,
  ACCOUNT_ADMIN: 20,
  ACCOUNT_USER:  10,
};

export function hasRole(userRole: string, minRole: UserRole): boolean {
  return (ROLE_WEIGHT[userRole as UserRole] ?? 0) >= ROLE_WEIGHT[minRole];
}

export function isAdmin(role: string): boolean {
  return hasRole(role, "ACCOUNT_ADMIN");
}

export function isAgencyLevel(role: string): boolean {
  return hasRole(role, "AGENCY_USER");
}
