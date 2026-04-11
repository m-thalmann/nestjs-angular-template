import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ApiResponse,
  DetailedUser,
  LoginRequest,
  ResetPasswordRequest,
  SendResetPasswordRequest,
  SignUpRequest,
  SuccessfulAuth,
  VerifyEmailRequest,
} from '@shared/api-interfaces';
import { Observable } from 'rxjs';
import { USE_REFRESH_TOKEN_HTTP_CONTEXT } from './use-refresh-token-http-context';

@Injectable({
  providedIn: 'root',
})
export class AuthDataService {
  private readonly httpClient = inject(HttpClient);

  getAuthenticatedUser(): Observable<ApiResponse<DetailedUser>> {
    return this.httpClient.get<ApiResponse<DetailedUser>>('/api/auth');
  }

  login(body: LoginRequest): Observable<ApiResponse<SuccessfulAuth>> {
    return this.httpClient.post<ApiResponse<SuccessfulAuth>>('/api/auth/login', body);
  }

  signUp(body: SignUpRequest): Observable<ApiResponse<SuccessfulAuth>> {
    return this.httpClient.post<ApiResponse<SuccessfulAuth>>('/api/auth/sign-up', body);
  }

  refreshToken(): Observable<ApiResponse<SuccessfulAuth>> {
    return this.httpClient.post<ApiResponse<SuccessfulAuth>>(
      '/api/auth/refresh',
      {},
      { context: new HttpContext().set(USE_REFRESH_TOKEN_HTTP_CONTEXT, true) },
    );
  }

  logout(): Observable<undefined> {
    return this.httpClient.post<undefined>('/api/auth/logout', {});
  }

  resetPassword(body: ResetPasswordRequest): Observable<undefined> {
    return this.httpClient.post<undefined>('/api/auth/reset-password', body);
  }

  sendResetPassword(body: SendResetPasswordRequest): Observable<undefined> {
    return this.httpClient.post<undefined>('/api/auth/reset-password/send', body);
  }

  verifyEmail(body: VerifyEmailRequest): Observable<undefined> {
    return this.httpClient.post<undefined>('/api/auth/email-verification', body);
  }

  resendEmailVerification(): Observable<undefined> {
    return this.httpClient.post<undefined>('/api/auth/email-verification/resend', {});
  }
}
