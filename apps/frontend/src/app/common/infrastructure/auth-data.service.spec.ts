import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { createMockDetailedUser } from '@frontend/testing';
import { ApiResponse, DetailedUser, SuccessfulAuth } from '@shared/api-interfaces';
import { AuthDataService } from './auth-data.service';

describe('AuthDataService', () => {
  let service: AuthDataService;
  let httpTesting: HttpTestingController;

  const mockDetailedUser = createMockDetailedUser();

  const mockSuccessfulAuth: SuccessfulAuth = {
    user: mockDetailedUser,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getAuthenticatedUser', () => {
    it('should GET /api/auth', () => {
      const mockResponse: ApiResponse<DetailedUser> = { data: mockDetailedUser };

      service.getAuthenticatedUser().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTesting.expectOne('/api/auth');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('login', () => {
    it('should POST /api/auth/login with credentials', () => {
      const body = { email: 'john.doe@example.com', password: 'password' };
      const mockResponse: ApiResponse<SuccessfulAuth> = { data: mockSuccessfulAuth };

      service.login(body).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTesting.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  describe('signUp', () => {
    it('should POST /api/auth/sign-up with user data', () => {
      const body = { name: 'Jane Doe', email: 'jane.doe@example.com', password: 'password' };
      const mockResponse: ApiResponse<SuccessfulAuth> = { data: mockSuccessfulAuth };

      service.signUp(body).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTesting.expectOne('/api/auth/sign-up');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  describe('refreshToken', () => {
    it('should POST /api/auth/refresh', () => {
      const mockResponse: ApiResponse<SuccessfulAuth> = { data: mockSuccessfulAuth };

      service.refreshToken().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTesting.expectOne('/api/auth/refresh');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('logout', () => {
    it('should POST /api/auth/logout', () => {
      service.logout().subscribe((response) => {
        expect(response).toBeNull();
      });

      const req = httpTesting.expectOne('/api/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('validateResetPasswordToken', () => {
    it('should GET /api/auth/reset-password/validate with token', () => {
      const token = 'reset-password-token';
      const mockResponse: ApiResponse<null> = { data: null };

      service.validateResetPasswordToken(token).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTesting.expectOne(`/api/auth/reset-password/validate?token=${token}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('resetPassword', () => {
    it('should POST /api/auth/reset-password with token and new password', () => {
      const body = { token: 'reset-token', newPassword: 'new-password' };

      service.resetPassword(body).subscribe((response) => {
        expect(response).toBeNull();
      });

      const req = httpTesting.expectOne('/api/auth/reset-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('sendResetPassword', () => {
    it('should POST /api/auth/reset-password/send with email', () => {
      const body = { email: 'user@example.com' };

      service.sendResetPassword(body).subscribe((response) => {
        expect(response).toBeNull();
      });

      const req = httpTesting.expectOne('/api/auth/reset-password/send');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('verifyEmail', () => {
    it('should POST /api/auth/email-verification with token', () => {
      const body = { token: 'verification-token' };
      const mockResponse: ApiResponse<DetailedUser> = { data: mockDetailedUser };

      service.verifyEmail(body).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTesting.expectOne('/api/auth/email-verification');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  describe('resendEmailVerification', () => {
    it('should POST /api/auth/email-verification/resend', () => {
      service.resendEmailVerification().subscribe((response) => {
        expect(response).toBeNull();
      });

      const req = httpTesting.expectOne('/api/auth/email-verification/resend');
      expect(req.request.method).toBe('POST');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
