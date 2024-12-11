import {
  CanActivate,
  CustomDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { AuthTokenService } from '../tokens/auth-token.service';

const IS_PUBLIC_KEY = 'isPublic';
export const Public: () => CustomDecorator<string> = () => SetMetadata(IS_PUBLIC_KEY, true);

const USE_REFRESH_TOKEN_AUTH = 'useRefreshTokenAuth';
export const RefreshTokenAuth: () => CustomDecorator<string> = () => SetMetadata(USE_REFRESH_TOKEN_AUTH, true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractTokenFromHeader(request);

    if (token === undefined) {
      if (this.isPublicRequest(context)) {
        return true;
      }

      throw new UnauthorizedException();
    }

    const expectRefreshToken = this.getExpectRefreshTokenAuth(context);

    const { user, authToken } = await this.authTokenService.validateToken(token, { expectRefreshToken });

    // @ts-expect-error Add user to request
    request.user = user;
    // @ts-expect-error Add auth token to request
    request.authToken = authToken;

    return true;
  }

  protected isPublicRequest(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }

  protected getExpectRefreshTokenAuth(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean | undefined>(USE_REFRESH_TOKEN_AUTH, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }

  protected extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
