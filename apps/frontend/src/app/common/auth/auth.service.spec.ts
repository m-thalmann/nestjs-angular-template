import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { DEFAULT_ROUTE } from '../../app.routes';
import { StorageService } from '../util/storage.service';
import { createMockUser } from '../util/test.utils';
import { AuthDataService } from './auth-data.service';
import { AuthService } from './auth.service';

@Injectable()
class AuthServiceTestClass extends AuthService {
  override deleteStoredTokens(): void {
    super.deleteStoredTokens();
  }

  static getAccessTokenKey(): string {
    return AuthService.ACCESS_TOKEN_KEY;
  }

  static getRefreshTokenKey(): string {
    return AuthService.REFRESH_TOKEN_KEY;
  }
}

describe('AuthService', () => {
  let service: AuthServiceTestClass;

  let mockStorageService: Partial<StorageService>;
  let mockAuthDataService: Partial<AuthDataService>;
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    mockStorageService = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    };

    mockAuthDataService = {
      getAuthenticatedUser: jest.fn(),
      logout: jest.fn(),
    };

    mockRouter = {
      navigateByUrl: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthServiceTestClass,
        { provide: StorageService, useValue: mockStorageService },
        { provide: AuthDataService, useValue: mockAuthDataService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthServiceTestClass);
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  describe('before init', () => {
    it('initialization$ should emit false', async () => {
      // TODO: test that isInitialized$ does not emit
    });

    it('user$ should emit null', async () => {
      await expect(firstValueFrom(service.user$)).resolves.toBeNull();
    });

    it('isAuthenticated$ should not emit', async () => {
      // TODO: test that isAuthenticated$ does not emit
    });
  });

  describe('getAccessToken', () => {
    it('should return the access token from storage', () => {
      const accessToken = 'access-token';

      (mockStorageService.get as jest.Mock).mockReturnValue(accessToken);

      expect(service.getAccessToken()).toBe(accessToken);
    });

    it('should return null if the access token is not in storage', () => {
      (mockStorageService.get as jest.Mock).mockReturnValue(null);

      expect(service.getAccessToken()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return the refresh token from storage', () => {
      const refreshToken = 'refresh-token';

      (mockStorageService.get as jest.Mock).mockReturnValue(refreshToken);

      expect(service.getRefreshToken()).toBe(refreshToken);
    });

    it('should return null if the refresh token is not in storage', () => {
      (mockStorageService.get as jest.Mock).mockReturnValue(null);

      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should delete stored tokens if no refresh token is found', async () => {
      service.getRefreshToken = jest.fn().mockReturnValue(null);
      service.deleteStoredTokens = jest.fn();

      await service.initialize();

      expect(service.deleteStoredTokens).toHaveBeenCalled();

      await expect(firstValueFrom(service.isInitialized$)).resolves.toBe(true);
    });

    it('should load and set the user when refresh token is found', async () => {
      (mockStorageService.get as jest.Mock).mockReturnValue('refresh-token');

      const mockUser = createMockUser();

      (mockAuthDataService.getAuthenticatedUser as jest.Mock).mockReturnValue(of({ data: mockUser }));

      await service.initialize();

      await expect(firstValueFrom(service.isInitialized$)).resolves.toBe(true);
      await expect(firstValueFrom(service.user$)).resolves.toEqual(mockUser);
    });

    it('should log out the user if the API call returns unauthorized', async () => {
      (mockStorageService.get as jest.Mock).mockReturnValue('refresh-token');

      (mockAuthDataService.getAuthenticatedUser as jest.Mock).mockReturnValue(
        throwError(
          () => new HttpErrorResponse({ status: HttpStatusCode.Unauthorized, error: { message: 'Unauthorized' } }),
        ),
      );

      service.logout = jest.fn();

      await service.initialize();

      expect(service.logout).toHaveBeenCalledWith(false);
      await expect(firstValueFrom(service.isInitialized$)).resolves.toBe(true);
      await expect(firstValueFrom(service.user$)).resolves.toBeNull();
    });

    it('should not initialize if the API call fails for another reason', async () => {
      (mockStorageService.get as jest.Mock).mockReturnValue('refresh-token');

      (mockAuthDataService.getAuthenticatedUser as jest.Mock).mockReturnValue(throwError(() => new Error('API error')));

      service.logout = jest.fn();

      await service.initialize();

      expect(service.logout).not.toHaveBeenCalled();
      // TODO: test that isInitialized$ does not emit
      await expect(firstValueFrom(service.user$)).resolves.toBeNull();
    });
  });

  describe('login', () => {
    it('should call updateAuth and redirect to the default route', async () => {
      const mockUser = createMockUser();

      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      service.updateAuth = jest.fn();

      await service.login({ user: mockUser, accessToken, refreshToken });

      expect(service.updateAuth).toHaveBeenCalledWith({ user: mockUser, accessToken, refreshToken });
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });

    it('should redirect to the specified route', async () => {
      const mockUser = createMockUser();

      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const redirectUrl = '/redirect';

      service.updateAuth = jest.fn();

      await service.login({ user: mockUser, accessToken, refreshToken, redirectUrl });

      expect(service.updateAuth).toHaveBeenCalledWith({ user: mockUser, accessToken, refreshToken });
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(redirectUrl);
    });
  });

  describe('updateAuth', () => {
    it('should set the access and refresh tokens and the user', async () => {
      const mockUser = createMockUser();

      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      service.updateAuth({ user: mockUser, accessToken, refreshToken });

      expect(mockStorageService.set).toHaveBeenCalledWith(AuthServiceTestClass.getAccessTokenKey(), accessToken);
      expect(mockStorageService.set).toHaveBeenCalledWith(AuthServiceTestClass.getRefreshTokenKey(), refreshToken);

      await expect(firstValueFrom(service.user$)).resolves.toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should delete stored tokens and log out from the API', async () => {
      service.deleteStoredTokens = jest.fn();
      (mockAuthDataService.logout as jest.Mock).mockReturnValue(of(undefined));

      await service.logout(true);

      expect(service.deleteStoredTokens).toHaveBeenCalled();
      await expect(firstValueFrom(service.user$)).resolves.toBeNull();
    });

    it('should not log out from the API if the flag is false', async () => {
      service.deleteStoredTokens = jest.fn();

      await service.logout(false);

      expect(service.deleteStoredTokens).toHaveBeenCalled();
      await expect(firstValueFrom(service.user$)).resolves.toBeNull();
      expect(mockAuthDataService.logout).not.toHaveBeenCalled();
    });
  });

  describe('deleteStoredTokens', () => {
    it('should remove the access and refresh tokens from storage', () => {
      service.deleteStoredTokens();

      expect(mockStorageService.remove).toHaveBeenCalledWith(AuthServiceTestClass.getAccessTokenKey());
      expect(mockStorageService.remove).toHaveBeenCalledWith(AuthServiceTestClass.getRefreshTokenKey());
    });
  });
});
