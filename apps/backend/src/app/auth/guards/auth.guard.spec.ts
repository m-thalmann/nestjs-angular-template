import {
  EMAIL_MUST_BE_VERIFIED_DECORATOR_KEY,
  IS_PUBLIC_DECORATOR_KEY,
  REFRESH_TOKEN_AUTH_DECORATOR_KEY,
} from '@backend/decorators';
import { createMockExecutionContext } from '@backend/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyRequest } from 'fastify';
import { createMockUser } from '../../user/testing';
import { AuthToken } from '../tokens/auth-token.entity';
import { AuthTokenService } from '../tokens/auth-token.service';
import { AuthGuard } from './auth.guard';

class AuthGuardTestClass extends AuthGuard {
  override isPublicRequest(context: ExecutionContext): boolean {
    return super.isPublicRequest(context);
  }

  override getExpectRefreshTokenAuth(context: ExecutionContext): boolean {
    return super.getExpectRefreshTokenAuth(context);
  }

  override getRequiresVerifiedEmail(context: ExecutionContext): boolean {
    return super.getRequiresVerifiedEmail(context);
  }

  override extractTokenFromHeader(request: FastifyRequest): string | undefined {
    return super.extractTokenFromHeader(request);
  }
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

    guard = await module.resolve<AuthGuardTestClass>(AuthGuardTestClass);
  });

  describe('canActivate', () => {
    it('should return true if the request is public', async () => {
      const context = createMockExecutionContext();

      guard.extractTokenFromHeader = jest.fn().mockReturnValue(undefined);
      guard.isPublicRequest = jest.fn().mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);

      expect(guard.extractTokenFromHeader).toHaveBeenCalledWith(context.switchToHttp().getRequest());
      expect(guard.isPublicRequest).toHaveBeenCalledWith(context);
    });

    it('should validate token if request is public and token is provided', async () => {
      const context = createMockExecutionContext();

      const expectedJwtToken = 'mock-jwt-token';

      const expectedUser = createMockUser();
      const expectedAuthToken = new AuthToken();

      guard.extractTokenFromHeader = jest.fn().mockReturnValue(expectedJwtToken);
      guard.isPublicRequest = jest.fn().mockReturnValue(true);

      mockAuthTokenService.validateToken = jest
        .fn()
        .mockResolvedValue({ user: expectedUser, authToken: expectedAuthToken });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);

      expect(mockAuthTokenService.validateToken).toHaveBeenCalledWith(expectedJwtToken, { expectRefreshToken: false });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(context.switchToHttp().getRequest().user).toBe(expectedUser);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(context.switchToHttp().getRequest().authToken).toBe(expectedAuthToken);
    });

    it('should throw an UnauthorizedException if no token is provided', async () => {
      const context = createMockExecutionContext();

      guard.isPublicRequest = jest.fn().mockReturnValue(false);
      guard.extractTokenFromHeader = jest.fn().mockReturnValue(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);

      expect(guard.extractTokenFromHeader).toHaveBeenCalledWith(context.switchToHttp().getRequest());
      expect(mockAuthTokenService.validateToken).not.toHaveBeenCalled();
    });

    it("should throw an UnauthorizedException if the user's email is not verified", async () => {
      const context = createMockExecutionContext();

      const expectedJwtToken = 'mock-jwt-token';

      const expectedUser = createMockUser();
      const expectedAuthToken = new AuthToken();
      expectedAuthToken.user = Promise.resolve(expectedUser);

      guard.getRequiresVerifiedEmail = jest.fn().mockReturnValue(true);

      guard.isPublicRequest = jest.fn().mockReturnValue(false);
      guard.extractTokenFromHeader = jest.fn().mockReturnValue(expectedJwtToken);
      guard.getExpectRefreshTokenAuth = jest.fn().mockReturnValue(false);

      mockAuthTokenService.validateToken = jest
        .fn()
        .mockResolvedValue({ user: expectedUser, authToken: expectedAuthToken });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);

      expect(guard.extractTokenFromHeader).toHaveBeenCalledWith(context.switchToHttp().getRequest());
      expect(mockAuthTokenService.validateToken).toHaveBeenCalled();
    });

    it.each([
      [false, false],
      [false, true],
      [true, false],
      [true, true],
    ])(
      'should return true if the token is valid and set the user and token on the request (expect refresh token: %p, must be verified: %p)',
      async (expectRefreshToken: boolean, emailMustBeVerified: boolean) => {
        const context = createMockExecutionContext();

        const expectedJwtToken = 'mock-jwt-token';

        const expectedUser = createMockUser();

        if (emailMustBeVerified) {
          expectedUser.emailVerifiedAt = new Date();
        }

        const expectedAuthToken = new AuthToken();
        expectedAuthToken.user = Promise.resolve(expectedUser);

        guard.isPublicRequest = jest.fn().mockReturnValue(false);
        guard.extractTokenFromHeader = jest.fn().mockReturnValue(expectedJwtToken);
        guard.getExpectRefreshTokenAuth = jest.fn().mockReturnValue(expectRefreshToken);
        guard.getRequiresVerifiedEmail = jest.fn().mockReturnValue(emailMustBeVerified);

        mockAuthTokenService.validateToken = jest
          .fn()
          .mockResolvedValue({ user: expectedUser, authToken: expectedAuthToken });

        const result = await guard.canActivate(context);

        expect(result).toBe(true);

        expect(guard.extractTokenFromHeader).toHaveBeenCalledWith(context.switchToHttp().getRequest());
        expect(guard.getExpectRefreshTokenAuth).toHaveBeenCalledWith(context);
        expect(mockAuthTokenService.validateToken).toHaveBeenCalledWith(expectedJwtToken, { expectRefreshToken });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(context.switchToHttp().getRequest().user).toBe(expectedUser);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(context.switchToHttp().getRequest().authToken).toBe(expectedAuthToken);
      },
    );

    it('should throw an UnauthorizedException if the token is invalid', async () => {
      const context = createMockExecutionContext();

      const expectedToken = new AuthToken();

      guard.isPublicRequest = jest.fn().mockReturnValue(false);
      guard.extractTokenFromHeader = jest.fn().mockReturnValue(expectedToken);

      mockAuthTokenService.validateToken = jest.fn().mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('isPublicRequest', () => {
    it('should return true if the handler is public', () => {
      const context = createMockExecutionContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(true);

      const result = guard.isPublicRequest(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_DECORATOR_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return false if the handler is not public', () => {
      const context = createMockExecutionContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(false);

      const result = guard.isPublicRequest(context);

      expect(result).toBe(false);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_DECORATOR_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return false if the handler is not annotated', () => {
      const context = createMockExecutionContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

      const result = guard.isPublicRequest(context);

      expect(result).toBe(false);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_DECORATOR_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('getExpectRefreshTokenAuth', () => {
    it('should return true if the RefreshTokenAuth decorator is used', () => {
      const context = createMockExecutionContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(true);

      const result = guard.getExpectRefreshTokenAuth(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(REFRESH_TOKEN_AUTH_DECORATOR_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return false if the RefreshTokenAuth decorator is not used', () => {
      const context = createMockExecutionContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

      const result = guard.getExpectRefreshTokenAuth(context);

      expect(result).toBe(false);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(REFRESH_TOKEN_AUTH_DECORATOR_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('getRequiresVerifiedEmail', () => {
    it('should return true if the EmailMustBeVerified decorator is used', () => {
      const context = createMockExecutionContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(true);

      const result = guard.getRequiresVerifiedEmail(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(EMAIL_MUST_BE_VERIFIED_DECORATOR_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return false if the EmailMustBeVerified decorator is not used', () => {
      const context = createMockExecutionContext();

      mockReflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

      const result = guard.getRequiresVerifiedEmail(context);

      expect(result).toBe(false);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(EMAIL_MUST_BE_VERIFIED_DECORATOR_KEY, [
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
