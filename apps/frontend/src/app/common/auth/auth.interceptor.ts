import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiHttpContext } from '@frontend/infrastructure';
import { getApiErrorMessage } from '@frontend/util';
import { EMAIL_UNVERIFIED_MESSAGE } from '@shared/api-interfaces';
import { isNull } from '@shared/common';
import { catchError, finalize, from, Observable, shareReplay, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);

  protected refreshTokens$: Observable<void> | null = null;

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!request.url.startsWith('/api') || request.context.get(ApiHttpContext.NoAuth)) {
      return next.handle(request);
    }

    const refreshTried = request.context.get(ApiHttpContext.RequestRefreshTried);
    const useRefreshToken = request.context.get(ApiHttpContext.UseRefreshToken);
    const noRefreshOnUnauthorized = request.context.get(ApiHttpContext.SkipRefreshingTokenOnUnauthorized);

    const token = useRefreshToken ? this.authService.getRefreshToken() : this.authService.getAccessToken();

    const authenticatedRequest = token ? this.addTokenToRequest(request, token) : request;

    if (refreshTried || useRefreshToken || noRefreshOnUnauthorized) {
      return next.handle(authenticatedRequest);
    }

    return next.handle(authenticatedRequest).pipe(
      catchError((error: unknown) => {
        if (!this.isUnauthorizedError(error) || this.isEmailUnverifiedError(error)) {
          return throwError(() => error);
        }

        return this.refreshTokens().pipe(
          take(1),
          switchMap(() => {
            const newToken = this.authService.getAccessToken();

            if (isNull(newToken)) {
              return throwError(() => error);
            }

            const retryRequest = this.addTokenToRequest(request, newToken);
            retryRequest.context.set(ApiHttpContext.RequestRefreshTried, true);

            return next.handle(retryRequest);
          }),
        );
      }),
    );
  }

  protected refreshTokens(): Observable<void> {
    if (isNull(this.refreshTokens$)) {
      this.refreshTokens$ = from(this.authService.refreshTokens()).pipe(
        catchError((refreshError: unknown) => {
          if (this.isUnauthorizedError(refreshError)) {
            this.authService.logout(); // TODO: should this be awaited?
          }

          return throwError(() => refreshError);
        }),
        finalize(() => {
          this.refreshTokens$ = null;
        }),
        shareReplay({ refCount: false, bufferSize: 1 }),
      );
    }

    return this.refreshTokens$;
  }

  protected addTokenToRequest(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  protected isUnauthorizedError(error: unknown): error is HttpErrorResponse {
    return error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized.valueOf();
  }

  protected isEmailUnverifiedError(error: HttpErrorResponse): boolean {
    return getApiErrorMessage(error) === EMAIL_UNVERIFIED_MESSAGE;
  }
}
