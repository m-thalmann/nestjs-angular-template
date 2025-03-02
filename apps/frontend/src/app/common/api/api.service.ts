import { HttpClient, HttpContext, HttpEvent, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PAGINATION_QUERY_PARAMS, PaginationParams } from '@app/shared-types';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { USE_REFRESH_TOKEN_HTTP_CONTEXT } from './auth.interceptor';

export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly configService = inject(ConfigService);
  private readonly httpClient = inject(HttpClient);

  get apiUrl(): string {
    return this.configService.config.apiUrl;
  }

  request<TResponse>(
    method: HttpMethod,
    url: string,
    options?: {
      body?: unknown;
      headers?: Record<string, Array<string> | string>;
      context?: HttpContext;
      params?: Record<string, ReadonlyArray<string> | string>;
      observe?: 'body';
      reportProgress?: boolean;
      responseType?: 'json';
      tokenType?: 'access' | 'refresh';
    },
  ): Observable<TResponse>;
  request(
    method: HttpMethod,
    url: string,
    options?: {
      body?: unknown;
      headers?: Record<string, Array<string> | string>;
      context?: HttpContext;
      params?: Record<string, ReadonlyArray<string> | string>;
      observe?: 'body';
      reportProgress?: boolean;
      responseType: 'blob';
      tokenType?: 'access' | 'refresh';
    },
  ): Observable<Blob>;
  request<TResponse>(
    method: HttpMethod,
    url: string,
    options?: {
      body?: unknown;
      headers?: Record<string, Array<string> | string>;
      context?: HttpContext;
      params?: Record<string, ReadonlyArray<string> | string>;
      observe: 'events';
      reportProgress?: boolean;
      responseType?: 'json';
      tokenType?: 'access' | 'refresh';
    },
  ): Observable<HttpEvent<TResponse>>;
  request(
    method: HttpMethod,
    url: string,
    options?: {
      body?: unknown;
      headers?: Record<string, Array<string> | string>;
      context?: HttpContext;
      params?: Record<string, ReadonlyArray<string> | string>;
      observe: 'events';
      reportProgress?: boolean;
      responseType: 'blob';
      tokenType?: 'access' | 'refresh';
    },
  ): Observable<HttpEvent<Blob>>;
  request<TResponse>(
    method: HttpMethod,
    url: string,
    options?: {
      body?: unknown;
      headers?: Record<string, Array<string> | string>;
      context?: HttpContext;
      params?: Record<string, ReadonlyArray<string> | string>;
      observe: 'response';
      reportProgress?: boolean;
      responseType?: 'json';
      tokenType?: 'access' | 'refresh';
    },
  ): Observable<HttpResponse<TResponse>>;
  request(
    method: HttpMethod,
    url: string,
    options?: {
      body?: unknown;
      headers?: Record<string, Array<string> | string>;
      context?: HttpContext;
      params?: Record<string, ReadonlyArray<string> | string>;
      observe: 'response';
      reportProgress?: boolean;
      responseType: 'blob';
      tokenType?: 'access' | 'refresh';
    },
  ): Observable<HttpResponse<Blob>>;
  request(
    method: HttpMethod,
    url: string,
    options?: {
      body?: unknown;
      headers?: Record<string, Array<string> | string>;
      context?: HttpContext;
      params?: Record<string, ReadonlyArray<string> | string>;
      observe?: 'body' | 'events' | 'response';
      reportProgress?: boolean;
      responseType?: 'blob' | 'json';
      tokenType?: 'access' | 'refresh';
    },
  ): Observable<unknown>;
  request(
    method: HttpMethod,
    url: string,
    options?: {
      body?: unknown;
      headers?: Record<string, Array<string> | string>;
      context?: HttpContext;
      params?: Record<string, ReadonlyArray<string> | string>;
      observe?: 'body' | 'events' | 'response';
      reportProgress?: boolean;
      responseType?: 'blob' | 'json';
      tokenType?: 'access' | 'refresh';
    },
  ): Observable<unknown> {
    const {
      body,
      headers,
      context = new HttpContext(),
      params,
      observe,
      reportProgress,
      responseType,
      tokenType = 'access',
    } = options ?? {};

    if (tokenType === 'refresh') {
      context.set(USE_REFRESH_TOKEN_HTTP_CONTEXT, true);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.httpClient.request(method, this.apiUrl + url, {
      body,
      headers,
      context,
      params,
      observe,
      reportProgress,
      responseType,
    });
  }

  buildPaginationParams(pagination?: PaginationParams): Record<string, string> {
    if (pagination === undefined) {
      return {};
    }

    const paginationParams: Record<string, string> = {
      [PAGINATION_QUERY_PARAMS.PAGE]: pagination.page.toString(),
    };

    if (pagination.perPage !== undefined) {
      paginationParams[PAGINATION_QUERY_PARAMS.PER_PAGE] = pagination.perPage.toString();
    }

    return paginationParams;
  }
}
