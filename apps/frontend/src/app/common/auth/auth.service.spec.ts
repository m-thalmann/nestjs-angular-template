import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthDataService } from '@frontend/infrastructure';
import { StorageService } from '@frontend/services';
import { createMockDetailedUser, promiseTimesOut } from '@frontend/testing';
import { DetailedUser, LoginRequest, SignUpRequest, SuccessfulAuth } from '@shared/api-interfaces';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
class AuthServiceTestClass extends AuthService {
  override updateAuthData(data: SuccessfulAuth): void {
    super.updateAuthData(data);
  }

  override deleteStoredTokens(): void {
    super.deleteStoredTokens();
  }

  _getAccessTokenKey(): string {
    return AuthService.ACCESS_TOKEN_KEY;
  }

  _getRefreshTokenKey(): string {
    return AuthService.REFRESH_TOKEN_KEY;
  }

  _setIsInitialized(value: boolean): void {
    this._isInitialized$.next(value);
  }

  _setAuthUser(user: DetailedUser | null): void {
    this._authUser$.next(user);
  }
}

describe('AuthService', () => {
  let service: AuthServiceTestClass;

  let mockStorageService: Partial<StorageService>;
  let mockAuthDataService: Partial<AuthDataService>;

  beforeEach(() => {
    mockStorageService = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    };

    mockAuthDataService = {
      getAuthenticatedUser: jest.fn(),
      login: jest.fn(),
      signUp: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    };

    jest.spyOn(console, 'error').mockReturnValue(undefined);
    jest.spyOn(console, 'info').mockReturnValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        AuthServiceTestClass,
        { provide: StorageService, useValue: mockStorageService },
        { provide: AuthDataService, useValue: mockAuthDataService },
      ],
    });
    service = TestBed.inject(AuthServiceTestClass);
  });

  describe('isAuthenticated$', () => {
    it('should not emit when not initialized', async () => {
      await expect(promiseTimesOut(firstValueFrom(service.isAuthenticated$))).resolves.toBe(true);
    });

    it('should emit false when initialized but no user is authenticated', async () => {
      service._setIsInitialized(true);
      service._setAuthUser(null);

      await expect(firstValueFrom(service.isAuthenticated$)).resolves.toBe(false);
    });

    it('should emit true when initialized and user is authenticated', async () => {
      const user = createMockDetailedUser();
      service._setIsInitialized(true);
      service._setAuthUser(user);

      await expect(firstValueFrom(service.isAuthenticated$)).resolves.toBe(true);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from storage', () => {
      (mockStorageService.get as jest.Mock).mockReturnValue('access-token');
      expect(service.getAccessToken()).toBe('access-token');
      expect(mockStorageService.get).toHaveBeenCalledWith(service._getAccessTokenKey());
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from storage', () => {
      (mockStorageService.get as jest.Mock).mockReturnValue('refresh-token');
      expect(service.getRefreshToken()).toBe('refresh-token');
      expect(mockStorageService.get).toHaveBeenCalledWith(service._getRefreshTokenKey());
    });
  });

  describe('initialize', () => {
    it('should initialize successfully when no refresh token is present', async () => {
      (mockStorageService.get as jest.Mock).mockReturnValue(null);
      service.deleteStoredTokens = jest.fn();

      await service.initialize();

      await expect(firstValueFrom(service.isInitialized$)).resolves.toBe(true);
      await expect(firstValueFrom(service.authUser$)).resolves.toBeNull();
      expect(service.deleteStoredTokens).toHaveBeenCalled();
    });

    it('should initialize successfully when refresh token is set', async () => {
      (mockStorageService.get as jest.Mock).mockReturnValue('refresh-token');
      const user = createMockDetailedUser();
      (mockAuthDataService.getAuthenticatedUser as jest.Mock).mockReturnValue(of({ data: user }));

      await service.initialize();

      await expect(firstValueFrom(service.isInitialized$)).resolves.toBe(true);
      await expect(firstValueFrom(service.authUser$)).resolves.toEqual(user);
    });

    it('should handle error during initialization', async () => {
      (mockStorageService.get as jest.Mock).mockReturnValue('refresh-token');
      const error = new HttpErrorResponse({ status: 0, statusText: 'Network error', error: { message: 'Test error' } });
      (mockAuthDataService.getAuthenticatedUser as jest.Mock).mockReturnValue(throwError(() => error));
      service.logout = jest.fn();

      await service.initialize();

      await expect(firstValueFrom(service.isInitialized$)).resolves.toBe(false);
      await expect(firstValueFrom(service.authUser$)).resolves.toBeNull();
      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalled();
      expect(service.logout).not.toHaveBeenCalled();
    });

    it('should handle unauthorized error during initialization', async () => {
      (mockStorageService.get as jest.Mock).mockReturnValue('refresh-token');
      const error = new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        error: { message: 'Test error' },
      });
      (mockAuthDataService.getAuthenticatedUser as jest.Mock).mockReturnValue(throwError(() => error));
      service.logout = jest.fn();

      await service.initialize();

      await expect(firstValueFrom(service.isInitialized$)).resolves.toBe(true);
      await expect(firstValueFrom(service.authUser$)).resolves.toBeNull();
      // eslint-disable-next-line no-console
      expect(console.info).toHaveBeenCalled();
      expect(service.logout).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully and update auth data', async () => {
      const loginData: LoginRequest = { email: 'test@example.com', password: 'password' };
      const responseData: SuccessfulAuth = {
        user: createMockDetailedUser(),
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      (mockAuthDataService.login as jest.Mock).mockReturnValue(of({ data: responseData }));
      service.updateAuthData = jest.fn();

      await service.login(loginData);

      expect(mockAuthDataService.login).toHaveBeenCalledWith(loginData);
      expect(service.updateAuthData).toHaveBeenCalledWith(responseData);
    });
  });

  describe('signUp', () => {
    it('should sign up successfully and update auth data', async () => {
      const signUpData: SignUpRequest = { email: 'test@example.com', password: 'password', name: 'Test User' };
      const responseData: SuccessfulAuth = {
        user: createMockDetailedUser(),
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      (mockAuthDataService.signUp as jest.Mock).mockReturnValue(of({ data: responseData }));
      service.updateAuthData = jest.fn();

      await service.signUp(signUpData);

      expect(mockAuthDataService.signUp).toHaveBeenCalledWith(signUpData);
      expect(service.updateAuthData).toHaveBeenCalledWith(responseData);
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear auth data', async () => {
      (mockAuthDataService.logout as jest.Mock).mockReturnValue(of(undefined));
      service.deleteStoredTokens = jest.fn();
      service._setAuthUser(createMockDetailedUser());

      await service.logout();

      expect(mockAuthDataService.logout).toHaveBeenCalled();
      expect(service.deleteStoredTokens).toHaveBeenCalled();
      await expect(firstValueFrom(service.authUser$)).resolves.toBeNull();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully and update auth data', async () => {
      const responseData: SuccessfulAuth = {
        user: createMockDetailedUser(),
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      (mockAuthDataService.refreshToken as jest.Mock).mockReturnValue(of({ data: responseData }));
      service.updateAuthData = jest.fn();

      await service.refreshTokens();

      expect(mockAuthDataService.refreshToken).toHaveBeenCalled();
      expect(service.updateAuthData).toHaveBeenCalledWith(responseData);
    });
  });

  describe('updateAuthData', () => {
    it('should update auth data and store tokens', async () => {
      const data: SuccessfulAuth = {
        user: createMockDetailedUser(),
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      service.updateAuthData(data);

      await expect(firstValueFrom(service.authUser$)).resolves.toBe(data.user);
      expect(mockStorageService.set).toHaveBeenCalledWith(service._getAccessTokenKey(), data.accessToken);
      expect(mockStorageService.set).toHaveBeenCalledWith(service._getRefreshTokenKey(), data.refreshToken);
    });
  });

  describe('deleteStoredTokens', () => {
    it('should remove tokens from storage', () => {
      service.deleteStoredTokens();

      expect(mockStorageService.remove).toHaveBeenCalledWith(service._getAccessTokenKey());
      expect(mockStorageService.remove).toHaveBeenCalledWith(service._getRefreshTokenKey());
    });
  });
});
