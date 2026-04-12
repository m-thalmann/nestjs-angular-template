import { User } from '@backend/user';
import { Inject, Injectable, InternalServerErrorException, PipeTransform, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { isUndefined } from '@shared/common';
import { PermissionFailMode } from './has-permission.decorator';
import { HasPermissionsGuard } from './has-permissions.guard';
import { MissingPermissionException } from './missing-permission.exception';
import { ConditionalPermission, hasPermission, isSimplePermission, Permission } from './permissions';

@Injectable()
export class HasPermissionsPipe<TEntity> implements PipeTransform<TEntity, TEntity> {
  constructor(
    @Inject(REQUEST)
    private readonly request: {
      user?: User;
      [HasPermissionsGuard.REQUEST_PERMISSION_KEY]?: Permission;
      [HasPermissionsGuard.REQUEST_PERMISSION_FAIL_MODE_KEY]?: PermissionFailMode;
    },
  ) {}

  transform(entity: TEntity): TEntity {
    const {
      user,
      [HasPermissionsGuard.REQUEST_PERMISSION_KEY]: permission,
      [HasPermissionsGuard.REQUEST_PERMISSION_FAIL_MODE_KEY]: permissionFailMode = PermissionFailMode.Forbidden,
    } = this.request;

    if (isUndefined(permission)) {
      throw new InternalServerErrorException('No permission metadata found on request');
    }

    if (isSimplePermission(permission)) {
      throw new InternalServerErrorException('HasPermissionsPipe can only be used with conditional permissions');
    }

    if (isUndefined(user)) {
      throw new UnauthorizedException();
    }

    if (!hasPermission(user, permission as ConditionalPermission<TEntity>, entity)) {
      throw new MissingPermissionException(permission, permissionFailMode);
    }

    return entity;
  }
}
