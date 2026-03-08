import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { Permission } from './permissions';

export const HAS_PERMISSION_DECORATOR_KEY = 'hasPermission';
export const PERMISSION_FAIL_MODE_KEY = 'permissionMode';

export type PermissionFailMode = 'forbidden' | 'notFound';

export const HasPermission: (
  permission: Permission,
  options?: { failWithNotFound?: boolean },
) => ReturnType<typeof applyDecorators> = (permission, { failWithNotFound = false } = {}) => {
  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [
    SetMetadata(HAS_PERMISSION_DECORATOR_KEY, permission),
    SetMetadata<string, PermissionFailMode>(PERMISSION_FAIL_MODE_KEY, failWithNotFound ? 'notFound' : 'forbidden'),
  ];

  if (!failWithNotFound) {
    decorators.push(
      ApiForbiddenResponse({
        description: 'Forbidden',
      }),
    );
  }

  return applyDecorators(...decorators);
};
