import { User } from '@backend/user';
import { Inject, Injectable, InternalServerErrorException, PipeTransform } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PermissionFailMode } from './has-permission.decorator';
import { HasPermissionGuard } from './has-permission.guard';
import { MissingPermissionException } from './missing-permission.exception';
import { ConditionalPermission, hasPermission, isSimplePermission, Permission } from './permissions';

@Injectable()
export class HasPermissionsPipe<TEntity> implements PipeTransform<TEntity, TEntity> {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  transform(entity: TEntity): TEntity {
    const {
      user,
      [HasPermissionGuard.REQUEST_PERMISSION_KEY]: permission,
      [HasPermissionGuard.REQUEST_PERMISSION_FAIL_MODE_KEY]: permissionFailMode = 'forbidden',
    } = this.request as {
      user?: User;
      [HasPermissionGuard.REQUEST_PERMISSION_KEY]?: Permission;
      [HasPermissionGuard.REQUEST_PERMISSION_FAIL_MODE_KEY]?: PermissionFailMode;
    };

    if (permission === undefined || isSimplePermission(permission)) {
      throw new InternalServerErrorException('HasPermissionsPipe can only be used with conditional permissions.');
    }

    if (user === undefined || !hasPermission(user, permission as ConditionalPermission<TEntity>, entity)) {
      throw new MissingPermissionException(permission, permissionFailMode);
    }

    return entity;
  }
}
