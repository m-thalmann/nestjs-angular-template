import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthDataService } from '@frontend/infrastructure';
import { StorageService } from '@frontend/services';
import { getApiErrorMessage, Logger } from '@frontend/util';
import { DetailedUser, LoginRequest, SignUpRequest, SuccessfulAuth } from '@shared/api-interfaces';
import { getErrorMessage, isNotNull, isNull } from '@shared/common';
import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, firstValueFrom, map, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  protected static readonly ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';
  protected static readonly REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';

  private readonly storageService = inject(StorageService);
  private readonly authDataService = inject(AuthDataService);

  protected readonly logger = Logger.create(AuthService);

  protected readonly _isInitialized$ = new BehaviorSubject<boolean>(false);
  readonly isInitialized$ = this._isInitialized$.asObservable();

  protected readonly _authUser$ = new BehaviorSubject<DetailedUser | null>(null);
  readonly authUser$ = this._authUser$.asObservable();

  readonly isAuthenticated$ = combineLatest([this.isInitialized$, this._authUser$]).pipe(
    filter(([isInitialized]) => isInitialized),
    map(([, user]) => isNotNull(user)),
    distinctUntilChanged(),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  // TODO: listen to auth changes in other tabs (observe storage)

  getAccessToken(): string | null {
    return this.storageService.get<string>(AuthService.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.storageService.get<string>(AuthService.REFRESH_TOKEN_KEY);
  }

  async initialize(): Promise<void> {
    if (isNull(this.getRefreshToken())) {
      this.deleteStoredTokens();
      this._isInitialized$.next(true);
      return;
    }

    try {
      const { data: user } = await firstValueFrom(this.authDataService.getAuthenticatedUser());

      this._authUser$.next(user);

      // TODO: handle unverified email (also handle when is as response from backend?) + how is this then updated again when user verifies?
    } catch (e) {
      if (!(e instanceof HttpErrorResponse) || e.status !== HttpStatusCode.Unauthorized.valueOf()) {
        // TODO: show snackbar to user
        this.logger.error('Error while initializing the user:', getErrorMessage(e));

        // not initialized!

        return;
      }

      await this.logout();

      this.logger.info('User logged out due to the following error:', getApiErrorMessage(e));
    }

    this._isInitialized$.next(true);
  }

  async login(loginData: LoginRequest): Promise<void> {
    const { data: responseData } = await firstValueFrom(this.authDataService.login(loginData));

    this.updateAuthData(responseData);
  }

  async signUp(signUpData: SignUpRequest): Promise<void> {
    const { data: responseData } = await firstValueFrom(this.authDataService.signUp(signUpData));

    this.updateAuthData(responseData);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.authDataService.logout());
    } catch {}

    this.deleteStoredTokens();

    this._authUser$.next(null);

    // TODO: check if route contains guard and if it does redirect/revalidate
  }

  async refreshTokens(): Promise<void> {
    const { data: responseData } = await firstValueFrom(this.authDataService.refreshToken());

    this.updateAuthData(responseData);
  }

  protected updateAuthData(data: SuccessfulAuth): void {
    this.storageService.set(AuthService.ACCESS_TOKEN_KEY, data.accessToken);
    this.storageService.set(AuthService.REFRESH_TOKEN_KEY, data.refreshToken);

    this._authUser$.next(data.user);
  }

  protected deleteStoredTokens(): void {
    this.storageService.remove(AuthService.ACCESS_TOKEN_KEY);
    this.storageService.remove(AuthService.REFRESH_TOKEN_KEY);
  }
}
