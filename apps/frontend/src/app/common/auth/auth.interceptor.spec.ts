import {
  HttpContext,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiHttpContext } from '@frontend/infrastructure';
import { getApiErrorMessage } from '@frontend/util';
import { EMAIL_UNVERIFIED_MESSAGE } from '@shared/api-interfaces';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

jest.mock('@frontend/util', () => ({
  getApiErrorMessage: jest.fn(),
}));

@Injectable()
class AuthInterceptorTestClass extends AuthInterceptor {
  getRefreshTokens$(): Observable<void> | null {
    return this.refreshTokens$;
  }

  setRefreshTokens$(value$: Observable<void> | null): void {
    this.refreshTokens$ = value$;
  }

  override refreshTokens(): Observable<void> {
    return super.refreshTokens();
  }

  override addTokenToRequest(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return super.addTokenToRequest(request, token);
  }

  override isUnauthorizedError(error: unknown): error is HttpErrorResponse {
    return super.isUnauthorizedError(error);
  }

  override isEmailUnverifiedError(error: HttpErrorResponse): boolean {
    return super.isEmailUnverifiedError(error);
  }
}

function createApiRequest(url: string = '/api/test', context?: HttpContext): HttpRequest<unknown> {
  return new HttpRequest('GET', url, { context });
}

function createMockHandler(response$?: Observable<HttpEvent<unknown>>): jest.Mocked<HttpHandler> {
  const handler: jest.Mocked<HttpHandler> = {
    handle: jest.fn().mockReturnValue(response$ ?? of(new HttpResponse({ status: 200 }))),
  };
  return handler;
}

function createUnauthorizedError(message: string = 'Unauthorized'): HttpErrorResponse {
  return new HttpErrorResponse({ status: HttpStatusCode.Unauthorized, error: { message } });
}

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptorTestClass;

  let mockAuthService: Partial<AuthService>;

  beforeEach(() => {
    mockAuthService = {
      getAccessToken: jest.fn().mockReturnValue('access-token'),
      getRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      refreshTokens: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [AuthInterceptorTestClass, { provide: AuthService, useValue: mockAuthService }],
    });

    interceptor = TestBed.inject(AuthInterceptorTestClass);
    (getApiErrorMessage as jest.Mock).mockClear();
  });

  describe('intercept', () => {
    beforeEach(() => {
      interceptor.addTokenToRequest = jest.fn().mockImplementation((request: Request) => request);
    });

    it('should pass through non-api requests without adding a token', async () => {
      const request = createApiRequest('/other/path');
      const handler = createMockHandler();

      await firstValueFrom(interceptor.intercept(request, handler));

      expect(handler.handle).toHaveBeenCalledWith(request);
      expect(interceptor.addTokenToRequest).not.toHaveBeenCalled();
    });

    it('should pass through requests with NoAuth context without adding a token', async () => {
      const context = new HttpContext().set(ApiHttpContext.NoAuth, true);
      const request = createApiRequest('/api/test', context);
      const handler = createMockHandler();

      await firstValueFrom(interceptor.intercept(request, handler));

      expect(handler.handle).toHaveBeenCalledWith(request);
      expect(interceptor.addTokenToRequest).not.toHaveBeenCalled();
    });

    it('should add the access token for api requests', async () => {
      const request = createApiRequest();
      const handler = createMockHandler();
      (mockAuthService.getAccessToken as jest.Mock).mockReturnValue('my-access-token');

      await firstValueFrom(interceptor.intercept(request, handler));

      expect(mockAuthService.getAccessToken).toHaveBeenCalled();
      expect(interceptor.addTokenToRequest).toHaveBeenCalledWith(request, 'my-access-token');
    });

    it('should use the refresh token when ApiHttpContext.UseRefreshToken is set', async () => {
      const context = new HttpContext().set(ApiHttpContext.UseRefreshToken, true);
      const request = createApiRequest('/api/auth/refresh', context);
      const handler = createMockHandler();
      (mockAuthService.getRefreshToken as jest.Mock).mockReturnValue('my-refresh-token');

      await firstValueFrom(interceptor.intercept(request, handler));

      expect(mockAuthService.getRefreshToken).toHaveBeenCalled();
      expect(interceptor.addTokenToRequest).toHaveBeenCalledWith(request, 'my-refresh-token');
    });

    it('should not add a token when no token is available', async () => {
      const request = createApiRequest();
      const handler = createMockHandler();
      (mockAuthService.getAccessToken as jest.Mock).mockReturnValue(null);

      await firstValueFrom(interceptor.intercept(request, handler));

      expect(interceptor.addTokenToRequest).not.toHaveBeenCalled();
      expect(handler.handle).toHaveBeenCalledWith(request);
    });

    it('should skip error handling and return directly for retried requests', async () => {
      const context = new HttpContext().set(ApiHttpContext.RequestRefreshTried, true);
      const request = createApiRequest('/api/test', context);
      const handler = createMockHandler();

      await firstValueFrom(interceptor.intercept(request, handler));

      expect(handler.handle).toHaveBeenCalledTimes(1);
    });

    it('should skip error handling and return directly for refresh token requests', async () => {
      const context = new HttpContext().set(ApiHttpContext.UseRefreshToken, true);
      const request = createApiRequest('/api/auth/refresh', context);
      const error = createUnauthorizedError();
      const handler = createMockHandler(throwError(() => error));
      // @ts-expect-error type mismatch
      interceptor.isUnauthorizedError = jest.fn().mockReturnValue(true);
      interceptor.isEmailUnverifiedError = jest.fn().mockReturnValue(false);
      interceptor.refreshTokens = jest.fn();

      await expect(firstValueFrom(interceptor.intercept(request, handler))).rejects.toBe(error);
      expect(interceptor.refreshTokens).not.toHaveBeenCalled();
    });

    it('should skip error handling and return directly for requests with ApiHttpContext.SkipRefreshingTokenOnUnauthorized context', async () => {
      const context = new HttpContext().set(ApiHttpContext.SkipRefreshingTokenOnUnauthorized, true);
      const request = createApiRequest('/api/test', context);
      const error = createUnauthorizedError();
      const handler = createMockHandler(throwError(() => error));
      // @ts-expect-error type mismatch
      interceptor.isUnauthorizedError = jest.fn().mockReturnValue(true);
      interceptor.isEmailUnverifiedError = jest.fn().mockReturnValue(false);
      interceptor.refreshTokens = jest.fn();

      await expect(firstValueFrom(interceptor.intercept(request, handler))).rejects.toBe(error);
      expect(interceptor.refreshTokens).not.toHaveBeenCalled();
    });

    it('should rethrow non-401 errors', async () => {
      const request = createApiRequest();
      const error = new HttpErrorResponse({ status: 500 });
      const handler = createMockHandler(throwError(() => error));
      // @ts-expect-error type mismatch
      interceptor.isUnauthorizedError = jest.fn().mockReturnValue(false);
      interceptor.refreshTokens = jest.fn();

      await expect(firstValueFrom(interceptor.intercept(request, handler))).rejects.toBe(error);
      expect(interceptor.refreshTokens).not.toHaveBeenCalled();
    });

    it('should rethrow email unverified errors without refreshing', async () => {
      const request = createApiRequest();
      const error = createUnauthorizedError(EMAIL_UNVERIFIED_MESSAGE);
      const handler = createMockHandler(throwError(() => error));
      // @ts-expect-error type mismatch
      interceptor.isUnauthorizedError = jest.fn().mockReturnValue(true);
      interceptor.isEmailUnverifiedError = jest.fn().mockReturnValue(true);
      interceptor.refreshTokens = jest.fn();

      await expect(firstValueFrom(interceptor.intercept(request, handler))).rejects.toBe(error);
      expect(interceptor.refreshTokens).not.toHaveBeenCalled();
    });

    it('should refresh and retry on 401 error', async () => {
      const request = createApiRequest();
      const error = createUnauthorizedError();
      const successResponse = new HttpResponse({ status: 200 });
      const handler = createMockHandler();
      handler.handle
        .mockImplementationOnce(() => throwError(() => error))
        .mockImplementationOnce(() => of(successResponse));
      // @ts-expect-error type mismatch
      interceptor.isUnauthorizedError = jest.fn().mockReturnValue(true);
      interceptor.isEmailUnverifiedError = jest.fn().mockReturnValue(false);
      interceptor.refreshTokens = jest.fn().mockReturnValue(of(undefined));
      (mockAuthService.getAccessToken as jest.Mock).mockReturnValue('new-access-token');

      const result = await firstValueFrom(interceptor.intercept(request, handler));

      expect(result).toBe(successResponse);
      expect(interceptor.refreshTokens).toHaveBeenCalledTimes(1);
      expect(handler.handle).toHaveBeenCalledTimes(2);
    });

    it('should refresh but not retry if new access token is null', async () => {
      const request = createApiRequest();
      const error = createUnauthorizedError();
      const handler = createMockHandler(throwError(() => error));
      // @ts-expect-error type mismatch
      interceptor.isUnauthorizedError = jest.fn().mockReturnValue(true);
      interceptor.isEmailUnverifiedError = jest.fn().mockReturnValue(false);
      interceptor.refreshTokens = jest.fn().mockReturnValue(of(undefined));
      (mockAuthService.getAccessToken as jest.Mock).mockReturnValue(null);

      await expect(firstValueFrom(interceptor.intercept(request, handler))).rejects.toBe(error);
      expect(interceptor.refreshTokens).toHaveBeenCalled();
      expect(handler.handle).toHaveBeenCalledTimes(1);
    });

    it('should set ApiHttpContext.RequestRefreshTried on the retry request', async () => {
      const request = createApiRequest();
      const error = createUnauthorizedError();
      const handler = createMockHandler();
      handler.handle
        .mockImplementationOnce(() => throwError(() => error))
        .mockImplementationOnce((req: HttpRequest<unknown>) => {
          expect(req.context.get(ApiHttpContext.RequestRefreshTried)).toBe(true);
          return of(new HttpResponse({ status: 200 }));
        });
      // @ts-expect-error type mismatch
      interceptor.isUnauthorizedError = jest.fn().mockReturnValue(true);
      interceptor.isEmailUnverifiedError = jest.fn().mockReturnValue(false);
      interceptor.refreshTokens = jest.fn().mockReturnValue(of(undefined));

      await firstValueFrom(interceptor.intercept(request, handler));
    });
  });

  describe('refreshTokens', () => {
    it('should call authService.refreshTokens and clear cached observable on complete', async () => {
      await firstValueFrom(interceptor.refreshTokens());

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(interceptor.getRefreshTokens$()).toBeNull();
    });

    it('should share the same observable for concurrent calls', () => {
      const obs1$ = interceptor.refreshTokens();
      const obs2$ = interceptor.refreshTokens();

      expect(obs1$).toBe(obs2$);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
    });

    it('should call logout when refresh fails with a 401', async () => {
      const refreshError = createUnauthorizedError();
      (mockAuthService.refreshTokens as jest.Mock).mockRejectedValue(refreshError);

      await expect(firstValueFrom(interceptor.refreshTokens())).rejects.toBe(refreshError);

      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should not call logout when refresh fails with a non-401 error', async () => {
      (mockAuthService.refreshTokens as jest.Mock).mockRejectedValue(new Error('network error'));

      await expect(firstValueFrom(interceptor.refreshTokens())).rejects.toThrow();

      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });

    it('should clear cached observable on error', async () => {
      (mockAuthService.refreshTokens as jest.Mock).mockRejectedValue(new Error('fail'));

      await expect(firstValueFrom(interceptor.refreshTokens())).rejects.toThrow();

      expect(interceptor.getRefreshTokens$()).toBeNull();
    });
  });

  describe('addTokenToRequest', () => {
    it('should clone the request with an Authorization header', () => {
      const request = createApiRequest();

      const result = interceptor.addTokenToRequest(request, 'my-token');

      expect(result).not.toBe(request);
      expect(result.headers.get('Authorization')).toBe('Bearer my-token');
    });
  });

  describe('isUnauthorizedError', () => {
    it('should return true for a 401 HttpErrorResponse', () => {
      const error = createUnauthorizedError();

      expect(interceptor.isUnauthorizedError(error)).toBe(true);
    });

    it('should return false for a non-401 HttpErrorResponse', () => {
      const error = new HttpErrorResponse({ status: 500 });

      expect(interceptor.isUnauthorizedError(error)).toBe(false);
    });

    it('should return false for a non-HttpErrorResponse error', () => {
      expect(interceptor.isUnauthorizedError(new Error('fail'))).toBe(false);
    });
  });

  describe('isEmailUnverifiedError', () => {
    it('should return true when error message matches EMAIL_UNVERIFIED_MESSAGE', () => {
      const error = createUnauthorizedError();
      (getApiErrorMessage as jest.Mock).mockReturnValue(EMAIL_UNVERIFIED_MESSAGE);

      expect(interceptor.isEmailUnverifiedError(error)).toBe(true);
      expect(getApiErrorMessage).toHaveBeenCalledWith(error);
    });

    it('should return false when error message does not match', () => {
      const error = createUnauthorizedError();
      (getApiErrorMessage as jest.Mock).mockReturnValue('Some other error');

      expect(interceptor.isEmailUnverifiedError(error)).toBe(false);
    });
  });
});
