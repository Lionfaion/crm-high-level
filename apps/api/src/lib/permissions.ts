import { Role, hasRole, isOneOf } from "./roles.js";

export type Action = "create" | "read" | "update" | "delete" | "manage";
export type Resource =
  | "agency"
  | "account"
  | "user"
  | "contact"
  | "pipeline"
  | "stage"
  | "opportunity"
  | "note"
  | "activity";

type PermissionRule = (role: string) => boolean;

// Permission matrix: resource → action → predicate
const PERMISSIONS: Record<Resource, Partial<Record<Action, PermissionRule>>> = {
  agency: {
    create:  (r) => isOneOf(r, [Role.SUPER_ADMIN]),
    read:    (r) => hasRole(r, Role.AGENCY_USER),
    update:  (r) => isOneOf(r, [Role.SUPER_ADMIN, Role.AGENCY_ADMIN]),
    delete:  (r) => isOneOf(r, [Role.SUPER_ADMIN]),
    manage:  (r) => isOneOf(r, [Role.SUPER_ADMIN]),
  },
  account: {
    create:  (r) => hasRole(r, Role.AGENCY_ADMIN),
    read:    (r) => hasRole(r, Role.AGENCY_USER),
    update:  (r) => isOneOf(r, [Role.SUPER_ADMIN, Role.AGENCY_ADMIN, Role.ACCOUNT_ADMIN]),
    delete:  (r) => hasRole(r, Role.AGENCY_ADMIN),
    manage:  (r) => hasRole(r, Role.AGENCY_ADMIN),
  },
  user: {
    create:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    read:    (r) => hasRole(r, Role.ACCOUNT_USER),
    update:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    delete:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    manage:  (r) => hasRole(r, Role.AGENCY_ADMIN),
  },
  contact: {
    create:  (r) => hasRole(r, Role.ACCOUNT_USER),
    read:    (r) => hasRole(r, Role.ACCOUNT_USER),
    update:  (r) => hasRole(r, Role.ACCOUNT_USER),
    delete:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    manage:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
  },
  pipeline: {
    create:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    read:    (r) => hasRole(r, Role.ACCOUNT_USER),
    update:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    delete:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    manage:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
  },
  stage: {
    create:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    read:    (r) => hasRole(r, Role.ACCOUNT_USER),
    update:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    delete:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    manage:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
  },
  opportunity: {
    create:  (r) => hasRole(r, Role.ACCOUNT_USER),
    read:    (r) => hasRole(r, Role.ACCOUNT_USER),
    update:  (r) => hasRole(r, Role.ACCOUNT_USER),
    delete:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    manage:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
  },
  note: {
    create:  (r) => hasRole(r, Role.ACCOUNT_USER),
    read:    (r) => hasRole(r, Role.ACCOUNT_USER),
    update:  (r) => hasRole(r, Role.ACCOUNT_USER),
    delete:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
    manage:  (r) => hasRole(r, Role.ACCOUNT_ADMIN),
  },
  activity: {
    create:  (r) => hasRole(r, Role.ACCOUNT_USER),
    read:    (r) => hasRole(r, Role.ACCOUNT_USER),
    update:  (_) => false,
    delete:  (r) => isOneOf(r, [Role.SUPER_ADMIN]),
    manage:  (r) => hasRole(r, Role.AGENCY_ADMIN),
  },
};

/**
 * Returns true when `role` is allowed to perform `action` on `resource`.
 * Defaults to false for undefined combinations.
 */
export function can(role: string, action: Action, resource: Resource): boolean {
  return PERMISSIONS[resource]?.[action]?.(role) ?? false;
}
