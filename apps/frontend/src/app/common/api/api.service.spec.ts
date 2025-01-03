import { HttpContext, HttpContextToken, HttpResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PAGINATION_QUERY_PARAMS } from '@app/shared-types';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { ApiService } from './api.service';

@Injectable()
class ApiServiceTestClass extends ApiService {
  override get apiUrl(): string {
    return super.apiUrl;
  }
}

describe('ApiService', () => {
  let apiService: ApiServiceTestClass;

  let httpTesting: HttpTestingController;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      config: {
        apiUrl: 'http://localhost:3000',
      },
    };

    TestBed.configureTestingModule({
      providers: [
        ApiServiceTestClass,
        { provide: ConfigService, useValue: mockConfigService },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    apiService = TestBed.inject(ApiServiceTestClass);

    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(apiService).toBeDefined();
  });

  it('should return apiUrl', () => {
    expect(apiService.apiUrl).toBe(mockConfigService.config?.apiUrl);
  });

  describe('request', () => {
    it('should make an http request with the provided method and url', async () => {
      const method = 'GET';
      const url = '/test';

      const expectedResponse = 'test';

      const resultPromise = firstValueFrom(apiService.request<string>(method, url));

      const req = httpTesting.expectOne(`${apiService.apiUrl}${url}`);
      req.flush(expectedResponse);

      const result = await resultPromise;

      expect(result).toEqual(expectedResponse);
    });

    it('should make an http request with the provided method, url and body', async () => {
      const method = 'POST';
      const url = '/test';
      const body = { test: 'test' };

      const expectedResponse = 'test';

      const resultPromise = firstValueFrom(apiService.request<string>(method, url, { body }));

      const req = httpTesting.expectOne(`${apiService.apiUrl}${url}`);
      req.flush(expectedResponse);

      const result = await resultPromise;

      expect(result).toEqual(expectedResponse);
      expect(req.request.body).toEqual(body);
    });

    it('should make an http request with the provided method, url and headers', async () => {
      const method = 'GET';
      const url = '/test';
      const headers = { 'Content-Type': 'application/json' };

      const expectedResponse = 'test';

      const resultPromise = firstValueFrom(apiService.request<string>(method, url, { headers }));

      const req = httpTesting.expectOne(`${apiService.apiUrl}${url}`);
      req.flush(expectedResponse);

      const result = await resultPromise;

      expect(result).toEqual(expectedResponse);
      expect(req.request.headers.get('Content-Type')).toEqual('application/json');
    });

    it('should make an http request with the provided method, url and context', async () => {
      const method = 'GET';
      const url = '/test';

      const HTTP_CONTEXT = new HttpContextToken<string | undefined>(() => undefined);

      const context = new HttpContext().set(HTTP_CONTEXT, 'test');

      const expectedResponse = 'test';

      const resultPromise = firstValueFrom(apiService.request<string>(method, url, { context }));

      const req = httpTesting.expectOne(`${apiService.apiUrl}${url}`);
      req.flush(expectedResponse);

      const result = await resultPromise;

      expect(result).toEqual(expectedResponse);
      expect(req.request.context.get(HTTP_CONTEXT)).toEqual('test');
    });

    it('should make an http request with the provided method, url and params', async () => {
      const method = 'GET';
      const url = '/test';
      const params = { test: 'test' };

      const expectedResponse = 'test';

      const resultPromise = firstValueFrom(apiService.request<string>(method, url, { params }));

      const req = httpTesting.expectOne(`${apiService.apiUrl}${url}?test=test`);
      req.flush(expectedResponse);

      const result = await resultPromise;

      expect(result).toEqual(expectedResponse);
    });

    it('should make an http request with the provided method, url and observe', async () => {
      const method = 'GET';
      const url = '/test';
      const observe = 'response';

      const expectedResponse = 'test';

      const resultPromise = firstValueFrom(apiService.request<string>(method, url, { observe }));

      const req = httpTesting.expectOne(`${apiService.apiUrl}${url}`);
      req.flush(expectedResponse);

      const result = await resultPromise;

      expect(result).toBeInstanceOf(HttpResponse);
      expect(result.body).toEqual(expectedResponse);
    });

    it('should make an http request with the provided method, url and responseType', async () => {
      const method = 'GET';
      const url = '/test';
      const responseType = 'blob';

      const expectedResponse = new Blob();

      const resultPromise = firstValueFrom(apiService.request(method, url, { responseType }));

      const req = httpTesting.expectOne(`${apiService.apiUrl}${url}`);
      req.flush(expectedResponse);

      const result = await resultPromise;

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('buildPaginationParams', () => {
    it('should return empty object when pagination is undefined', () => {
      const paginationParams = apiService.buildPaginationParams(undefined);

      expect(paginationParams).toEqual({});
    });

    it('should return page param when pagination is defined', () => {
      const paginationParams = apiService.buildPaginationParams({ page: 1 });

      expect(paginationParams).toEqual({ [PAGINATION_QUERY_PARAMS.PAGE]: '1' });
    });

    it('should return page and perPage params when pagination is defined', () => {
      const paginationParams = apiService.buildPaginationParams({ page: 1, perPage: 10 });

      expect(paginationParams).toEqual({
        [PAGINATION_QUERY_PARAMS.PAGE]: '1',
        [PAGINATION_QUERY_PARAMS.PER_PAGE]: '10',
      });
    });
  });
});
