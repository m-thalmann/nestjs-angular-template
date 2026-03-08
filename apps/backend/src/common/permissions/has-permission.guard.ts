import { User } from '@backend/user';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { HAS_PERMISSION_DECORATOR_KEY, PERMISSION_FAIL_MODE_KEY, PermissionFailMode } from './has-permission.decorator';
import { MissingPermissionException } from './missing-permission.exception';
import { hasPermission, Permission } from './permissions';

@Injectable()
export class HasPermissionGuard implements CanActivate {
  static readonly REQUEST_PERMISSION_KEY = 'requiredPermission';
  static readonly REQUEST_PERMISSION_FAIL_MODE_KEY = 'permissionFailMode';

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = (request as { user?: User }).user;

    const requiredPermission = this.reflector.get<Permission | undefined>(
      HAS_PERMISSION_DECORATOR_KEY,
      context.getHandler(),
    );
    const permissionFailMode =
      this.reflector.get<PermissionFailMode | undefined>(PERMISSION_FAIL_MODE_KEY, context.getHandler()) ?? 'forbidden';

    // @ts-expect-error Add required permission to request
    request[HasPermissionGuard.REQUEST_PERMISSION_KEY] = requiredPermission;
    // @ts-expect-error Add permission fail mode to request
    request[HasPermissionGuard.REQUEST_PERMISSION_FAIL_MODE_KEY] = permissionFailMode;

    if (requiredPermission === undefined) {
      // no permissions required
      return true;
    }

    if (user === undefined || !hasPermission(user, requiredPermission)) {
      throw new MissingPermissionException(requiredPermission, permissionFailMode);
    }

    return true;
  }
}
