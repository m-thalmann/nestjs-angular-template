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
import { AuthTokenService } from '../auth-token.service';
import { AUTH_TOKEN_TYPES, AuthTokenType } from '../dto/auth-token-type.dto';

const IS_PUBLIC_KEY = 'isPublic';
export const Public: () => CustomDecorator<string> = () => SetMetadata(IS_PUBLIC_KEY, true);

const USE_AUTH_TOKEN_TYPE = 'useAuthTokenType';
export const UseAuthTokenType: (type: AuthTokenType) => CustomDecorator<string> = (type: AuthTokenType) =>
  SetMetadata(USE_AUTH_TOKEN_TYPE, type);

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

    const expectedTokenType = this.getTokenType(context);

    const { user, authToken } = await this.authTokenService.validateToken(token, expectedTokenType);

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

  protected getTokenType(context: ExecutionContext): AuthTokenType {
    return (
      this.reflector.getAllAndOverride<AuthTokenType | undefined>(USE_AUTH_TOKEN_TYPE, [
        context.getHandler(),
        context.getClass(),
      ]) ?? AUTH_TOKEN_TYPES.ACCESS
    );
  }

  protected extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
