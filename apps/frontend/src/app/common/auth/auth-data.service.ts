import { inject, Injectable } from '@angular/core';
import { ApiResponse, DetailedUserDto } from '@app/shared-types';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthDataService {
  private readonly apiService = inject(ApiService);

  getAuthenticatedUser(): Observable<ApiResponse<DetailedUserDto>> {
    return this.apiService.request<ApiResponse<DetailedUserDto>>('GET', '/auth');
  }

  login(
    email: string,
    password: string,
  ): Observable<ApiResponse<{ user: DetailedUserDto; accessToken: string; refreshToken: string }>> {
    return this.apiService.request<ApiResponse<{ user: DetailedUserDto; accessToken: string; refreshToken: string }>>(
      'POST',
      '/auth/login',
      { body: { email, password } },
    );
  }

  logout(): Observable<void> {
    return this.apiService.request<undefined>('POST', '/auth/logout');
  }

  refreshToken(): Observable<ApiResponse<{ user: DetailedUserDto; accessToken: string; refreshToken: string }>> {
    return this.apiService.request<ApiResponse<{ user: DetailedUserDto; accessToken: string; refreshToken: string }>>(
      'POST',
      '/auth/refresh',
      {
        tokenType: 'refresh',
      },
    );
  }
}
