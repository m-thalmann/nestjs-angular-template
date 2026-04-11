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
import { USE_REFRESH_TOKEN_HTTP_CONTEXT } from '@frontend/infrastructure';
import { getApiErrorMessage } from '@frontend/util';
import { EMAIL_UNVERIFIED_MESSAGE } from '@shared/api-interfaces';
import { catchError, finalize, from, Observable, shareReplay, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const REQUEST_REFRESH_TRIED_CONTEXT = new HttpContextToken<boolean>(() => false);

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);

  protected refreshTokens$: Observable<void> | null = null;

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!request.url.startsWith('/api')) {
      return next.handle(request);
    }

    const useRefreshToken = request.context.get(USE_REFRESH_TOKEN_HTTP_CONTEXT);

    const token = useRefreshToken ? this.authService.getRefreshToken() : this.authService.getAccessToken();

    const authenticatedRequest = token ? this.addTokenToRequest(request, token) : request;

    if (request.context.get(REQUEST_REFRESH_TRIED_CONTEXT)) {
      return next.handle(authenticatedRequest);
    }

    return next.handle(authenticatedRequest).pipe(
      catchError((error: unknown) => {
        if (!this.isUnauthorizedError(error) || this.isEmailUnverifiedError(error) || useRefreshToken) {
          return throwError(() => error);
        }

        return this.refreshTokens().pipe(
          take(1),
          switchMap(() => {
            const newToken = this.authService.getAccessToken();

            if (newToken === null) {
              return throwError(() => error);
            }

            const retryRequest = this.addTokenToRequest(request, newToken);
            retryRequest.context.set(REQUEST_REFRESH_TRIED_CONTEXT, true);

            return next.handle(retryRequest);
          }),
        );
      }),
    );
  }

  protected refreshTokens(): Observable<void> {
    if (this.refreshTokens$ === null) {
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
