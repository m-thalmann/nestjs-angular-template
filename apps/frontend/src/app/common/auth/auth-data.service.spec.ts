import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ApiService } from '../api/api.service';
import { createMockUser } from '../util/test.utils';
import { AuthDataService } from './auth-data.service';

describe('AuthDataService', () => {
  let service: AuthDataService;

  let mockApiService: Partial<ApiService>;

  beforeEach(() => {
    mockApiService = {
      request: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: mockApiService }],
    });

    service = TestBed.inject(AuthDataService);
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthenticatedUser', () => {
    it('should make the correct api call', async () => {
      const expectedUser = createMockUser();

      (mockApiService.request as jest.Mock).mockReturnValue(of({ data: expectedUser }));

      const response = await firstValueFrom(service.getAuthenticatedUser());

      expect(response.data).toEqual(expectedUser);
      expect(mockApiService.request).toHaveBeenCalledWith('GET', '/auth');
    });
  });

  describe('logout', () => {
    it('should make the correct api call', async () => {
      (mockApiService.request as jest.Mock).mockReturnValue(of(undefined));

      await firstValueFrom(service.logout());

      expect(mockApiService.request).toHaveBeenCalledWith('POST', '/auth/logout');
    });
  });

  describe('refreshToken', () => {
    it('should make the correct api call', async () => {
      const expectedUser = createMockUser();
      const expectedAccessToken = 'access-token';
      const expectedRefreshToken = 'refresh-token';

      (mockApiService.request as jest.Mock).mockReturnValue(
        of({
          data: {
            user: expectedUser,
            accessToken: expectedAccessToken,
            refreshToken: expectedRefreshToken,
          },
        }),
      );

      const response = await firstValueFrom(service.refreshToken());

      expect(response.data).toEqual({
        user: expectedUser,
        accessToken: expectedAccessToken,
        refreshToken: expectedRefreshToken,
      });
      expect(mockApiService.request).toHaveBeenCalledWith('POST', '/auth/refresh', {
        tokenType: 'refresh',
      });
    });
  });
});
