import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Config } from './config.model';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
class ConfigServiceTestClass extends ConfigService {
  setConfigTesting(config: Config): void {
    this._config = config;
  }
}

describe('ConfigService', () => {
  let service: ConfigServiceTestClass;

  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ConfigServiceTestClass);

    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  describe('config', () => {
    it('should throw an error if config is not loaded', () => {
      expect(() => service.config).toThrow();
    });

    it('should return the loaded config', async () => {
      const config: Config = { apiUrl: 'http://localhost:3000' };

      service.setConfigTesting(config);

      expect(service.config).toEqual(config);
    });
  });

  describe('load', () => {
    it('should load the config', async () => {
      const config: Config = { apiUrl: 'http://localhost:3000' };

      const loadingPromise = service.load();

      const req = httpTesting.expectOne(ConfigService.API_URL);
      req.flush(config);

      await loadingPromise;

      expect(service.config).toEqual(config);
    });

    it('should throw an error if loading the config fails', async () => {
      const loadingPromise = service.load();

      const req = httpTesting.expectOne(ConfigService.API_URL);
      req.flush('Failed!', { status: 500, statusText: 'Internal Server Error' });

      await expect(loadingPromise).rejects.toThrow();
    });
  });
});
