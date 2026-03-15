import { User } from '@backend/user';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { HAS_PERMISSION_DECORATOR_KEY, PERMISSION_FAIL_MODE_KEY, PermissionFailMode } from './has-permission.decorator';
import { MissingPermissionException } from './missing-permission.exception';
import { hasPermission, Permission } from './permissions';

@Injectable()
export class HasPermissionsGuard implements CanActivate {
  static readonly REQUEST_PERMISSION_KEY = 'requiredPermission';
  static readonly REQUEST_PERMISSION_FAIL_MODE_KEY = 'permissionFailMode';

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<
      FastifyRequest & {
        user?: User;
        [HasPermissionsGuard.REQUEST_PERMISSION_KEY]?: Permission;
        [HasPermissionsGuard.REQUEST_PERMISSION_FAIL_MODE_KEY]?: PermissionFailMode;
      }
    >();

    const requiredPermission = this.reflector.get<Permission | undefined>(
      HAS_PERMISSION_DECORATOR_KEY,
      context.getHandler(),
    );
    const permissionFailMode =
      this.reflector.get<PermissionFailMode | undefined>(PERMISSION_FAIL_MODE_KEY, context.getHandler()) ??
      PermissionFailMode.Forbidden;

    if (requiredPermission === undefined) {
      // no permissions required
      return true;
    }

    const user = request.user;

    if (user === undefined) {
      throw new UnauthorizedException('User must be authenticated to check permissions');
    }

    if (!hasPermission(user, requiredPermission)) {
      throw new MissingPermissionException(requiredPermission, permissionFailMode);
    }

    request[HasPermissionsGuard.REQUEST_PERMISSION_KEY] = requiredPermission;
    request[HasPermissionsGuard.REQUEST_PERMISSION_FAIL_MODE_KEY] = permissionFailMode;

    return true;
  }
}
