import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DetailedUserDto } from '@app/shared-types';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  Observable,
  ReplaySubject,
  shareReplay,
} from 'rxjs';
import { DEFAULT_ROUTE } from '../../app.routes';
import { getApiErrorMessage } from '../util/error.utils';
import { Logger } from '../util/logger';
import { StorageService } from '../util/storage.service';
import { AuthDataService } from './auth-data.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  protected static readonly ACCESS_TOKEN_KEY: string = 'ACCESS_TOKEN';
  protected static readonly REFRESH_TOKEN_KEY: string = 'REFRESH_TOKEN';

  private readonly storageService: StorageService = inject(StorageService);
  private readonly authDataService: AuthDataService = inject(AuthDataService);
  private readonly router: Router = inject(Router);
  private readonly logger: Logger = new Logger(AuthService.name);

  protected readonly _isInitialized$: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  readonly isInitialized$: Observable<boolean> = this._isInitialized$.asObservable();

  protected readonly _user$: BehaviorSubject<DetailedUserDto | null> = new BehaviorSubject<DetailedUserDto | null>(
    null,
  );
  readonly user$: Observable<DetailedUserDto | null> = this._user$.asObservable();

  readonly isAuthenticated$: Observable<boolean> = combineLatest([this.isInitialized$, this._user$]).pipe(
    filter(([isInitialized]) => isInitialized),
    map(([, user]) => user !== null),
    distinctUntilChanged(),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  getAccessToken(): string | null {
    return this.storageService.get<string>(AuthService.ACCESS_TOKEN_KEY, null);
  }

  getRefreshToken(): string | null {
    return this.storageService.get<string>(AuthService.REFRESH_TOKEN_KEY, null);
  }

  async initialize(): Promise<void> {
    if (this.getRefreshToken() === null) {
      this.deleteStoredTokens();
      this._isInitialized$.next(true);
      return;
    }

    try {
      const user = await firstValueFrom(this.authDataService.getAuthenticatedUser());

      this._user$.next(user.data);

      // TODO: handle unverified email (also handle when is as response from backend?) + how is this then updated again when user verifies?
    } catch (e) {
      if (!(e instanceof HttpErrorResponse) || e.status !== HttpStatusCode.Unauthorized.valueOf()) {
        // TODO: show snackbar to user
        this.logger.error('Error while initializing the user:', e);

        // not initialized!

        return;
      }

      await this.logout(false);

      this.logger.info('User logged out due to the following error:', getApiErrorMessage(e));
    }

    this._isInitialized$.next(true);
  }

  async login(options: {
    user: DetailedUserDto;
    accessToken: string;
    refreshToken: string | null;
    redirectUrl?: string;
  }): Promise<void> {
    const { user, accessToken, refreshToken, redirectUrl = DEFAULT_ROUTE } = options;

    this.updateAuth({ user, accessToken, refreshToken });

    await this.router.navigateByUrl(redirectUrl);
  }

  updateAuth(options: { user: DetailedUserDto; accessToken: string; refreshToken: string | null }): void {
    const { user, accessToken, refreshToken } = options;

    this.storageService.set(AuthService.ACCESS_TOKEN_KEY, accessToken);
    this.storageService.set(AuthService.REFRESH_TOKEN_KEY, refreshToken);

    this._user$.next(user);
  }

  async logout(logoutFromApi: boolean): Promise<void> {
    if (logoutFromApi) {
      try {
        await firstValueFrom(this.authDataService.logout());
      } catch {}
    }

    this.deleteStoredTokens();

    this._user$.next(null);

    // TODO: check if route contains guard and if it does redirect/revalidate

    // TODO: show snackbar to user
  }

  protected deleteStoredTokens(): void {
    this.storageService.remove(AuthService.ACCESS_TOKEN_KEY);
    this.storageService.remove(AuthService.REFRESH_TOKEN_KEY);
  }
}
