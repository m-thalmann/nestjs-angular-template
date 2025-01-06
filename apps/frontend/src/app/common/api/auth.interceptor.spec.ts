/* eslint-disable max-lines */
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpRequest, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMAIL_UNVERIFIED_MESSAGE } from '@app/shared-types';
import { delay, firstValueFrom, Observable, of, Subject, throwError } from 'rxjs';
import { AuthDataService } from '../auth/auth-data.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../config/config.service';
import { createMockUser } from '../util/test.utils';
import { ApiService } from './api.service';
import { AuthInterceptor, REQUEST_REFRESH_TRIED_CONTEXT, USE_REFRESH_TOKEN_HTTP_CONTEXT } from './auth.interceptor';

@Injectable()
class AuthInterceptorTestClass extends AuthInterceptor {
  override refreshTokens(): Observable<void> {
    return super.refreshTokens();
  }

  override refreshAndRetry(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return super.refreshAndRetry(request, next);
  }

  override appendTokenToRequest(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
    return super.appendTokenToRequest(request, token);
  }

  override isRetriedRequest(request: HttpRequest<unknown>): boolean {
    return super.isRetriedRequest(request);
  }

  override isUnauthorizedError(error: unknown): error is HttpErrorResponse {
    return super.isUnauthorizedError(error);
  }

  override isUnverifiedError(error: unknown): error is HttpErrorResponse {
    return super.isUnverifiedError(error);
  }

  override logoutAndThrowError(error: unknown): Observable<never> {
    return super.logoutAndThrowError(error);
  }

  _getIsRefreshing(): boolean {
    return this.isRefreshing;
  }

  _setIsRefreshing(value: boolean): void {
    this.isRefreshing = value;
  }

  // eslint-disable-next-line rxjs/no-exposed-subjects
  _getDoneRefreshing$(): Subject<Error | undefined> {
    return this.doneRefreshing$;
  }
}

function mockNextHandler(): HttpHandler {
  return {
    handle: jest.fn().mockImplementation((req) => of(req)),
  };
}

function buildRequest(url: string, options?: { refreshToken?: true; refreshTried?: true }): HttpRequest<unknown> {
  const request = new HttpRequest('GET', url);

  if (options?.refreshToken) {
    request.context.set(USE_REFRESH_TOKEN_HTTP_CONTEXT, true);
  }
  if (options?.refreshTried) {
    request.context.set(REQUEST_REFRESH_TRIED_CONTEXT, true);
  }

  return request;
}

const MOCK_API_URL = 'http://localhost:3000';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptorTestClass;

  let mockAuthDataService: Partial<AuthDataService>;
  let mockAuthService: Partial<AuthService>;
  let mockApiService: Partial<ApiService>;

  beforeEach(() => {
    mockAuthDataService = {
      refreshToken: jest.fn(),
    };

    mockAuthService = {
      getAccessToken: jest.fn(),
      getRefreshToken: jest.fn(),
      logout: jest.fn(),
      updateAuth: jest.fn(),
    };

    mockApiService = {
      apiUrl: MOCK_API_URL,
    };

    TestBed.configureTestingModule({
      providers: [
        AuthInterceptorTestClass,
        { provide: AuthDataService, useValue: mockAuthDataService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    interceptor = TestBed.inject(AuthInterceptorTestClass);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  describe('intercept', () => {
    it('should return the request if the request URL is the config URL', async () => {
      const request = buildRequest(ConfigService.CONFIG_URL);

      const result = await firstValueFrom(interceptor.intercept(request, mockNextHandler()));

      expect(result).toBe(request);
    });

    it('should return the request if the request URL does not start with the API URL', async () => {
      const request = buildRequest('/other');

      const result = await firstValueFrom(interceptor.intercept(request, mockNextHandler()));

      expect(result).toBe(request);
    });

    it('should refresh and retry the request if already refreshing and the request does not use the refresh token', async () => {
      const request = buildRequest(MOCK_API_URL);

      interceptor._setIsRefreshing(true);

      interceptor.refreshAndRetry = jest.fn().mockReturnValue(of(request));

      const next = mockNextHandler();

      const result = await firstValueFrom(interceptor.intercept(request, next));

      expect(result).toBe(request);
      expect(interceptor.refreshAndRetry).toHaveBeenCalledWith(request, next);
      expect(next.handle).not.toHaveBeenCalled();
    });

    it('should logout and throw error when using refresh token but no refresh token is set', async () => {
      const request = buildRequest(MOCK_API_URL, { refreshToken: true });

      interceptor.logoutAndThrowError = jest.fn().mockImplementation((e: Error) => throwError(() => e));

      mockAuthService.getRefreshToken = jest.fn().mockReturnValue(null);

      const resultPromise = firstValueFrom(interceptor.intercept(request, mockNextHandler()));

      await expect(resultPromise).rejects.toThrow('No refresh token found');
      expect(interceptor.logoutAndThrowError).toHaveBeenCalled();
    });

    it('should append the access token to the request and return the next handler', async () => {
      const request = buildRequest(MOCK_API_URL);
      const next = mockNextHandler();
      const mockToken = 'token';

      mockAuthService.getAccessToken = jest.fn().mockReturnValue(mockToken);

      interceptor.appendTokenToRequest = jest.fn().mockReturnValue(request);

      const result = await firstValueFrom(interceptor.intercept(request, next));

      expect(result).toBe(request);
      expect(interceptor.appendTokenToRequest).toHaveBeenCalledWith(request, mockToken);
    });

    it('should append the refresh token to the request and return the next handler', async () => {
      const request = buildRequest(MOCK_API_URL, { refreshToken: true });
      const next = mockNextHandler();
      const mockToken = 'token';

      mockAuthService.getRefreshToken = jest.fn().mockReturnValue(mockToken);

      interceptor.appendTokenToRequest = jest.fn().mockReturnValue(request);

      const result = await firstValueFrom(interceptor.intercept(request, next));

      expect(result).toBe(request);
      expect(interceptor.appendTokenToRequest).toHaveBeenCalledWith(request, mockToken);
    });

    it('should throw error when request error is not an unauthorized error', async () => {
      const request = buildRequest(MOCK_API_URL);

      const error = new Error('Test error');

      interceptor.refreshAndRetry = jest.fn();

      const next = mockNextHandler();
      next.handle = jest.fn().mockReturnValue(throwError(() => error));

      const resultPromise = firstValueFrom(interceptor.intercept(request, next));

      await expect(resultPromise).rejects.toThrow(error);
      expect(interceptor.refreshAndRetry).not.toHaveBeenCalled();
    });

    it('should throw error when request error is an unverified error', async () => {
      const request = buildRequest(MOCK_API_URL);

      const error = new Error('My test verification error');

      interceptor.refreshAndRetry = jest.fn();
      // @ts-expect-error type mismatch
      interceptor.isUnverifiedError = jest.fn().mockReturnValue(true);

      const next = mockNextHandler();
      next.handle = jest.fn().mockReturnValue(throwError(() => error));

      const resultPromise = firstValueFrom(interceptor.intercept(request, next));

      await expect(resultPromise).rejects.toThrow(error);
      expect(interceptor.refreshAndRetry).not.toHaveBeenCalled();
    });

    it('should throw error when error on request that has already been retried', async () => {
      const request = buildRequest(MOCK_API_URL, { refreshTried: true });

      const error = new Error('Test error');

      interceptor.refreshAndRetry = jest.fn();

      const next = mockNextHandler();
      next.handle = jest.fn().mockReturnValue(throwError(() => error));

      const resultPromise = firstValueFrom(interceptor.intercept(request, next));

      await expect(resultPromise).rejects.toThrow(error);
      expect(interceptor.refreshAndRetry).not.toHaveBeenCalled();
    });

    it('should throw error when error on request that uses refresh token', async () => {
      const request = buildRequest(MOCK_API_URL, { refreshToken: true });

      const error = new Error('Test error');

      interceptor.refreshAndRetry = jest.fn();

      const next = mockNextHandler();
      next.handle = jest.fn().mockReturnValue(throwError(() => error));

      const resultPromise = firstValueFrom(interceptor.intercept(request, next));

      await expect(resultPromise).rejects.toThrow(error);
      expect(interceptor.refreshAndRetry).not.toHaveBeenCalled();
    });

    it('should refresh and retry the request when an unauthorized error occurs', async () => {
      const request = buildRequest(MOCK_API_URL);

      const next = mockNextHandler();

      interceptor.refreshAndRetry = jest.fn().mockReturnValue(of(request));

      interceptor.appendTokenToRequest = jest.fn().mockReturnValue(request);

      next.handle = jest
        .fn()
        .mockReturnValue(throwError(() => new HttpErrorResponse({ status: HttpStatusCode.Unauthorized.valueOf() })));

      const result = await firstValueFrom(interceptor.intercept(request, next));

      expect(result).toBe(request);
      expect(interceptor.refreshAndRetry).toHaveBeenCalledWith(request, next);
    });
  });

  describe('refreshTokens', () => {
    describe('not already refreshing', () => {
      it('should refresh the tokens and emit when done', async () => {
        const mockAccessToken = 'access-token';
        const mockRefreshToken = 'refresh-token';
        const mockUser = createMockUser();

        (mockAuthDataService.refreshToken as jest.Mock).mockReturnValue(
          of({ data: { accessToken: mockAccessToken, refreshToken: mockRefreshToken, user: mockUser } }).pipe(delay(0)),
        );

        expect(interceptor._getIsRefreshing()).toBe(false);

        const doneRefreshingPromise = firstValueFrom(interceptor._getDoneRefreshing$());
        const resultObservable$ = interceptor.refreshTokens();

        expect(interceptor._getIsRefreshing()).toBe(true);

        await expect(firstValueFrom(resultObservable$)).resolves.toBeUndefined();

        expect(mockAuthDataService.refreshToken).toHaveBeenCalled();
        expect(mockAuthService.updateAuth).toHaveBeenCalledWith({
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
          user: mockUser,
        });
        expect(interceptor._getIsRefreshing()).toBe(false);
        await expect(doneRefreshingPromise).resolves.toBeUndefined();
      });

      it('should throw when refreshing fails without unauthorized error', async () => {
        const error = new Error('Test error');

        interceptor.logoutAndThrowError = jest.fn();

        (mockAuthDataService.refreshToken as jest.Mock).mockReturnValue(throwError(() => error));

        expect(interceptor._getIsRefreshing()).toBe(false);

        const doneRefreshingPromise = firstValueFrom(interceptor._getDoneRefreshing$());
        const resultObservable$ = interceptor.refreshTokens();

        await expect(firstValueFrom(resultObservable$)).rejects.toBe(error);

        expect(mockAuthService.updateAuth).not.toHaveBeenCalled();
        expect(interceptor._getIsRefreshing()).toBe(false);
        await expect(doneRefreshingPromise).resolves.toBe(error);
        expect(interceptor.logoutAndThrowError).not.toHaveBeenCalledWith(error);
      });

      it('should throw when refreshing fails with unauthorized error', async () => {
        const error = new HttpErrorResponse({ status: 401 });

        interceptor.logoutAndThrowError = jest.fn().mockReturnValue(throwError(() => error));

        (mockAuthDataService.refreshToken as jest.Mock).mockReturnValue(throwError(() => error));

        expect(interceptor._getIsRefreshing()).toBe(false);

        const doneRefreshingPromise = firstValueFrom(interceptor._getDoneRefreshing$());
        const resultObservable$ = interceptor.refreshTokens();

        await expect(firstValueFrom(resultObservable$)).rejects.toBe(error);

        expect(mockAuthService.updateAuth).not.toHaveBeenCalled();
        expect(interceptor._getIsRefreshing()).toBe(false);
        await expect(doneRefreshingPromise).resolves.toBe(error);
        expect(interceptor.logoutAndThrowError).toHaveBeenCalledWith(error);
      });
    });

    describe('already refreshing', () => {
      it('should emit when doneRefreshing$ emits', async () => {
        interceptor._setIsRefreshing(true);

        const resultPromise = firstValueFrom(interceptor.refreshTokens());

        interceptor._getDoneRefreshing$().next(undefined);

        await expect(resultPromise).resolves.toBeUndefined();
        expect(mockAuthDataService.refreshToken).not.toHaveBeenCalled();
      });

      it('should throw when doneRefreshing$ emits an error', async () => {
        interceptor._setIsRefreshing(true);

        const error = new Error('Test error');
        const resultPromise = firstValueFrom(interceptor.refreshTokens());

        interceptor._getDoneRefreshing$().next(error);

        await expect(resultPromise).rejects.toBe(error);
        expect(mockAuthDataService.refreshToken).not.toHaveBeenCalled();
      });
    });
  });

  describe('refreshAndRetry', () => {
    it('should set the refresh tried context, refresh the tokens and retry the request', async () => {
      const request = buildRequest(MOCK_API_URL);

      const next = mockNextHandler();

      interceptor.refreshTokens = jest.fn().mockReturnValue(of(undefined));
      interceptor.intercept = jest.fn().mockReturnValue(of(request));

      expect(request.context.get(REQUEST_REFRESH_TRIED_CONTEXT)).toBe(false);

      const resultPromise = firstValueFrom(interceptor.refreshAndRetry(request, next));

      expect(request.context.get(REQUEST_REFRESH_TRIED_CONTEXT)).toBe(true);

      await expect(resultPromise).resolves.toBe(request);
      expect(interceptor.refreshTokens).toHaveBeenCalled();
      expect(interceptor.intercept).toHaveBeenCalledWith(request, next);
    });
  });

  describe('appendTokenToRequest', () => {
    it('should append the token to the request', () => {
      const request = buildRequest(MOCK_API_URL);

      const mockToken = 'token';

      const result = interceptor.appendTokenToRequest(request, mockToken);

      expect(result.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(result).not.toBe(request);
    });

    it('should return the request if the token is null', () => {
      const request = buildRequest(MOCK_API_URL);

      const result = interceptor.appendTokenToRequest(request, null);

      expect(result).toBe(request);
    });
  });

  describe('isRetriedRequest', () => {
    it('should return true if the request has the refresh tried context', () => {
      const request = buildRequest(MOCK_API_URL, { refreshTried: true });

      expect(interceptor.isRetriedRequest(request)).toBe(true);
    });

    it('should return false if the request does not have the refresh tried context', () => {
      const request = buildRequest(MOCK_API_URL);

      expect(interceptor.isRetriedRequest(request)).toBe(false);
    });
  });

  describe('isUnauthorizedError', () => {
    it('should return true if the error is an HTTP error with status 401', () => {
      const error = new HttpErrorResponse({ status: HttpStatusCode.Unauthorized.valueOf() });

      expect(interceptor.isUnauthorizedError(error)).toBe(true);
    });

    it('should return false if the error is not an HTTP error', () => {
      const error = new Error('Test error');

      expect(interceptor.isUnauthorizedError(error)).toBe(false);
    });

    it('should return false if the error is an HTTP error with status other than 401', () => {
      const error = new HttpErrorResponse({ status: HttpStatusCode.Forbidden.valueOf() });

      expect(interceptor.isUnauthorizedError(error)).toBe(false);
    });
  });

  describe('isUnverifiedError', () => {
    it('should return false if the error is not an unauthorized error', () => {
      const error = new Error('Test error');

      expect(interceptor.isUnverifiedError(error)).toBe(false);
    });

    it('should return false if the error is an unauthorized error with status other than 401', () => {
      const error = new HttpErrorResponse({ status: HttpStatusCode.Forbidden.valueOf() });

      expect(interceptor.isUnverifiedError(error)).toBe(false);
    });

    it('should return false if the error is an unauthorized error without an error message', () => {
      const error = new HttpErrorResponse({ status: HttpStatusCode.Unauthorized.valueOf() });

      expect(interceptor.isUnverifiedError(error)).toBe(false);
    });

    it('should return true if the error is an unauthorized error with the unverified message', () => {
      const error = new HttpErrorResponse({
        status: HttpStatusCode.Unauthorized.valueOf(),
        error: { message: EMAIL_UNVERIFIED_MESSAGE },
      });

      expect(interceptor.isUnverifiedError(error)).toBe(true);
    });
  });

  describe('logoutAndThrowError', () => {
    it('should logout the user and throw the error', async () => {
      const error = new HttpErrorResponse({ status: HttpStatusCode.Unauthorized.valueOf() });

      mockAuthService.logout = jest.fn().mockResolvedValue(undefined);

      const resultPromise = firstValueFrom(interceptor.logoutAndThrowError(error));

      await expect(resultPromise).rejects.toBe(error);
      expect(mockAuthService.logout).toHaveBeenCalledWith(false);
    });

    it('should throw the error but not logout when the error is a unverified error', async () => {
      const error = new HttpErrorResponse({
        status: HttpStatusCode.Unauthorized.valueOf(),
        error: { message: EMAIL_UNVERIFIED_MESSAGE },
      });

      const resultPromise = firstValueFrom(interceptor.logoutAndThrowError(error));

      await expect(resultPromise).rejects.toBe(error);
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });
  });
});
