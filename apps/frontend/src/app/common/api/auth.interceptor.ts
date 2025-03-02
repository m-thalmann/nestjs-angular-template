import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EMAIL_UNVERIFIED_MESSAGE } from '@app/shared-types';
import {
  catchError,
  EMPTY,
  firstValueFrom,
  from,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { AuthDataService } from '../auth/auth-data.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../config/config.service';
import { ApiService } from './api.service';

export const USE_REFRESH_TOKEN_HTTP_CONTEXT = new HttpContextToken<boolean>(() => false);
export const REQUEST_REFRESH_TRIED_CONTEXT = new HttpContextToken<boolean>(() => false);

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authDataService = inject(AuthDataService);
  private readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);

  protected isRefreshing = false;
  protected doneRefreshing$ = new Subject<Error | undefined>();

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url === ConfigService.CONFIG_URL || !request.url.startsWith(this.apiService.apiUrl)) {
      return next.handle(request);
    }

    const useRefreshToken = request.context.get(USE_REFRESH_TOKEN_HTTP_CONTEXT);

    if (this.isRefreshing && !useRefreshToken) {
      return this.refreshAndRetry(request, next);
    }

    const token = useRefreshToken ? this.authService.getRefreshToken() : this.authService.getAccessToken();

    if (token === null && useRefreshToken) {
      return this.logoutAndThrowError(new Error('No refresh token found'));
    }

    const req = this.appendTokenToRequest(request, token);

    return next.handle(req).pipe(
      catchError((error: unknown) => {
        if (
          !this.isUnauthorizedError(error) ||
          this.isUnverifiedError(error) ||
          this.isRetriedRequest(req) ||
          useRefreshToken
        ) {
          return throwError(() => error);
        }

        return this.refreshAndRetry(req, next);
      }),
    );
  }

  protected refreshTokens(): Observable<void> {
    // to prevent emissions being lost in the meantime, since it doesn't (and shouldn't) share replay
    const doneRefreshing = firstValueFrom(this.doneRefreshing$);

    if (!this.isRefreshing) {
      this.isRefreshing = true;

      this.authDataService
        .refreshToken()
        .pipe(
          tap(({ data: { accessToken, refreshToken, user } }) => {
            this.authService.updateAuth({ accessToken, refreshToken, user });

            this.isRefreshing = false;
            this.doneRefreshing$.next(undefined);
          }),
          catchError((error: unknown) => {
            const handleError: () => Observable<never> = () => {
              this.isRefreshing = false;
              this.doneRefreshing$.next(error as Error);

              return EMPTY;
            };

            if (this.isUnauthorizedError(error)) {
              return this.logoutAndThrowError(error).pipe(catchError(handleError));
            }

            return handleError();
          }),
          take(1),
        )
        .subscribe();
    }

    return from(doneRefreshing).pipe(
      take(1),
      switchMap((possibleError) => (possibleError === undefined ? of(undefined) : throwError(() => possibleError))),
    );
  }

  protected refreshAndRetry(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    request.context.set(REQUEST_REFRESH_TRIED_CONTEXT, true);

    return this.refreshTokens().pipe(switchMap(() => this.intercept(request, next)));
  }

  protected appendTokenToRequest(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
    if (token !== null) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return request;
  }

  protected isRetriedRequest(request: HttpRequest<unknown>): boolean {
    return request.context.get(REQUEST_REFRESH_TRIED_CONTEXT);
  }

  protected isUnauthorizedError(error: unknown): error is HttpErrorResponse {
    return error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized.valueOf();
  }

  protected isUnverifiedError(error: unknown): error is HttpErrorResponse {
    if (!this.isUnauthorizedError(error)) {
      return false;
    }

    const message = (error.error as { message?: string } | undefined)?.message;

    return message === EMAIL_UNVERIFIED_MESSAGE;
  }

  /**
   * **Note:** Doesnt logout the user if it is an unverified error.
   */
  protected logoutAndThrowError(error: unknown): Observable<never> {
    if (this.isUnverifiedError(error)) {
      return throwError(() => error);
    }

    return from(this.authService.logout(false)).pipe(switchMap(() => throwError(() => error)));
  }
}
