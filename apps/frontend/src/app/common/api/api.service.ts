import { HttpClient, HttpContext, HttpEvent, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PAGINATION_QUERY_PARAMS, PaginationParams } from '@app/shared-types';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';

export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly configService: ConfigService = inject(ConfigService);
  private readonly httpClient: HttpClient = inject(HttpClient);

  protected get apiUrl(): string {
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
    },
  ): Observable<unknown> {
    const { body, headers, context, params, observe, reportProgress, responseType } = options ?? {};

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
