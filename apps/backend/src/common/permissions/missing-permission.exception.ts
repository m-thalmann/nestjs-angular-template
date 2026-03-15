import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PermissionFailMode } from './has-permission.decorator';
import { getPermissionName, Permission } from './permissions';

export class MissingPermissionException extends Error {
  constructor(permission: Permission, failMode: PermissionFailMode) {
    super();

    if (failMode === PermissionFailMode.NotFound) {
      return new NotFoundException();
    }

    return new ForbiddenException(`User does not have required permission: ${getPermissionName(permission)}`);
  }
}
