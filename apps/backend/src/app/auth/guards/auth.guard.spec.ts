import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyRequest } from 'fastify';
import { User } from '../../users';
import { AuthToken } from '../auth-token.entity';
import { AuthTokenService } from '../auth-token.service';
import { AUTH_TOKEN_TYPES, AuthTokenType } from '../dto/auth-token-type.dto';
import { AuthGuard } from './auth.guard';

class AuthGuardTestClass extends AuthGuard {
  override isPublicRequest(context: ExecutionContext): boolean {
    return super.isPublicRequest(context);
  }

  override getTokenType(context: ExecutionContext): AuthTokenType {
    return super.getTokenType(context);
  }

  override extractTokenFromHeader(request: FastifyRequest): string | undefined {
    return super.extractTokenFromHeader(request);
  }
}

function buildMockContext(): ExecutionContext {
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ req: 'mock-request' }),
    }),
    getHandler: jest.fn().mockReturnValue('mock-handler'),
    getClass: jest.fn().mockReturnValue('mock-class'),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuardTestClass;

  let mockAuthTokenService: Partial<AuthTokenService>;
  let mockReflector: Partial<Reflector>;

  beforeEach(async () => {
    mockAuthTokenService = {
      validateToken: jest.fn(),
    };

    mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuardTestClass,
        {
          provide: AuthTokenService,
          useValue: mockAuthTokenService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<AuthGuardTestClass>(AuthGuardTestClass);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if the request is public', async () => {
      const context = buildMockContext();

      guard.isPublicRequest = jest.fn().mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw an UnauthorizedException if no token is provided', async () => {
      const context = buildMockContext();

      guard.isPublicRequest = jest.fn().mockReturnValue(false);
      guard.extractTokenFromHeader = jest.fn().mockReturnValue(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(guard.extractTokenFromHeader).toHaveBeenCalledWith(context.switchToHttp().getRequest());
      expect(mockAuthTokenService.validateToken).not.toHaveBeenCalled();
    });

    it.each([[AUTH_TOKEN_TYPES.ACCESS], [AUTH_TOKEN_TYPES.REFRESH_PAIR]])(
      'should return true if the token is valid and set the user and token on the request (type: %s)',
      async (expectedTokenType: AuthTokenType) => {
        const context = buildMockContext();

        const expectedUser = new User();

        const expectedToken = new AuthToken();
        expectedToken.user = Promise.resolve(expectedUser);

        guard.isPublicRequest = jest.fn().mockReturnValue(false);
        guard.extractTokenFromHeader = jest.fn().mockReturnValue(expectedToken);
        guard.getTokenType = jest.fn().mockReturnValue(expectedTokenType);

        mockAuthTokenService.validateToken = jest.fn().mockResolvedValue(expectedUser);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(guard.extractTokenFromHeader).toHaveBeenCalledWith(context.switchToHttp().getRequest());
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(guard.getTokenType).toHaveBeenCalledWith(context);
        expect(mockAuthTokenService.validateToken).toHaveBeenCalledWith(expectedToken, expectedTokenType);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(context.switchToHttp().getRequest().user).toBe(expectedUser);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(context.switchToHttp().getRequest().authToken).toBe(expectedToken);
      },
    );

    it('should throw an UnauthorizedException if the token is invalid', async () => {
      const context = buildMockContext();

      const expectedToken = new AuthToken();

      guard.isPublicRequest = jest.fn().mockReturnValue(false);
      guard.extractTokenFromHeader = jest.fn().mockReturnValue(expectedToken);

      mockAuthTokenService.validateToken = jest.fn().mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('isPublicRequest', () => {
    it('should return true if the handler is public', () => {
      const context = buildMockContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(true);

      const result = guard.isPublicRequest(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return false if the handler is not public', () => {
      const context = buildMockContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(false);

      const result = guard.isPublicRequest(context);

      expect(result).toBe(false);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return false if the handler is not annotated', () => {
      const context = buildMockContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

      const result = guard.isPublicRequest(context);

      expect(result).toBe(false);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('getTokenType', () => {
    it('should return the token type if it is set', () => {
      const context = buildMockContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(AUTH_TOKEN_TYPES.REFRESH_PAIR);

      const result = guard.getTokenType(context);

      expect(result).toBe(AUTH_TOKEN_TYPES.REFRESH_PAIR);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('useAuthTokenType', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return the default token type if it is not set', () => {
      const context = buildMockContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

      const result = guard.getTokenType(context);

      expect(result).toBe(AUTH_TOKEN_TYPES.ACCESS);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('useAuthTokenType', [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should return the token if it is present', () => {
      const expectedToken = 'mock-token';

      // @ts-expect-error type mismatch
      const request: FastifyRequest = { headers: { authorization: `Bearer ${expectedToken}` } };

      const result = guard.extractTokenFromHeader(request);

      expect(result).toBe(expectedToken);
    });

    it('should return undefined if the token is not present', () => {
      // @ts-expect-error type mismatch
      const request: FastifyRequest = { headers: {} };

      const result = guard.extractTokenFromHeader(request);

      expect(result).toBeUndefined();
    });

    it('should return undefined if the token is not a bearer token', () => {
      // @ts-expect-error type mismatch
      const request: FastifyRequest = { headers: { authorization: 'Basic mock token' } };

      const result = guard.extractTokenFromHeader(request);

      expect(result).toBeUndefined();
    });
  });
});
