import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { ObjectValues } from '@shared/common';
import { Permission } from './permissions';

export const HAS_PERMISSION_DECORATOR_KEY = 'hasPermission';
export const PERMISSION_FAIL_MODE_KEY = 'permissionMode';

export const PermissionFailMode = {
  Forbidden: 'forbidden',
  NotFound: 'notFound',
} as const;

export type PermissionFailMode = ObjectValues<typeof PermissionFailMode>;

export const HasPermission: (
  permission: Permission,
  options?: { failMode?: PermissionFailMode },
) => ReturnType<typeof applyDecorators> = (permission, { failMode = PermissionFailMode.Forbidden } = {}) => {
  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [
    SetMetadata(HAS_PERMISSION_DECORATOR_KEY, permission),
    SetMetadata<string, PermissionFailMode>(PERMISSION_FAIL_MODE_KEY, failMode),
  ];

  if (failMode === PermissionFailMode.Forbidden) {
    decorators.push(
      ApiForbiddenResponse({
        description: 'Forbidden',
      }),
    );
  }

  return applyDecorators(...decorators);
};
