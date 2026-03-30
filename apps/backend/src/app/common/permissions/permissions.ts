import { User, USER_PERMISSIONS } from '@backend/user';
import { ObjectValues } from '@shared/common';
import { PermissionDefinition } from './permission-definition.model';
import { Role } from './role.model';

const PERMISSIONS = {
  ...USER_PERMISSIONS,
} as const satisfies Record<string, PermissionDefinition<never>>;

export const Permission = Object.keys(PERMISSIONS).reduce(
  (acc, key) => ({ ...acc, [key]: key }),
  {} as { [K in keyof typeof PERMISSIONS]: K },
);
export type Permission = ObjectValues<typeof Permission>;

export type SimplePermission = {
  [P in keyof typeof Permission]: (typeof PERMISSIONS)[P] extends [string] ? P : never;
}[keyof typeof Permission];

export type ConditionalPermission<TEntity> = {
  [P in keyof typeof Permission]: (typeof PERMISSIONS)[P] extends [string, (user: User, entity: TEntity) => boolean]
    ? P
    : never;
}[keyof typeof Permission];

const ROLE_PERMISSIONS: Record<Role, ReadonlyArray<Permission>> = {
  [Role.Admin]: Object.values(Permission),
  [Role.User]: [Permission.ReadUser, Permission.UpdateAuthUser, Permission.DeleteUser],
} as const;

export function isSimplePermission(permission: Permission): permission is SimplePermission {
  return PERMISSIONS[permission].length === 1;
}

export function getPermissionName(permission: Permission): string {
  return PERMISSIONS[permission][0];
}

export function hasPermission(user: User, permission: Permission): boolean;
export function hasPermission<TEntity>(
  user: User,
  permission: ConditionalPermission<TEntity>,
  entity?: TEntity,
): boolean;
export function hasPermission(user: User, permission: Permission, entity?: unknown): boolean {
  const rolePermissions = ROLE_PERMISSIONS[user.role];

  if (!rolePermissions.includes(permission)) {
    return false;
  }

  if (isSimplePermission(permission)) {
    return true;
  }

  if (entity === undefined) {
    return true; // just checking if the user has the permission, not if they have it for a specific entity
  }

  const [, condition] = PERMISSIONS[permission];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  return condition(user, entity as any);
}
