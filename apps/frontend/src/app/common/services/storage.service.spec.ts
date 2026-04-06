import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, skip } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable()
class StorageServiceTestClass extends StorageService {
  override generateKey(key: string): string {
    return super.generateKey(key);
  }

  override parseValue<T>(key: string, value: string | null, defaultValue?: T | null): T | null {
    return super.parseValue<T>(key, value, defaultValue);
  }
}

describe('StorageService', () => {
  let service: StorageServiceTestClass;

  beforeEach(() => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    jest.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
    jest.spyOn(Storage.prototype, 'removeItem').mockReturnValue(undefined);

    jest.spyOn(console, 'error').mockReturnValue(undefined);

    TestBed.configureTestingModule({
      providers: [StorageServiceTestClass],
    });
    service = TestBed.inject(StorageServiceTestClass);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('get', () => {
    it('should load value from localStorage and parse it', () => {
      (Storage.prototype.getItem as jest.Mock).mockReturnValue('{"key":"value"}');
      service.parseValue = jest.fn().mockReturnValue('parsedValue');

      const result = service.get('testKey');

      expect(Storage.prototype.getItem).toHaveBeenCalledWith('APP_testKey');
      expect(service.parseValue).toHaveBeenCalledWith('APP_testKey', '{"key":"value"}', null);
      expect(result).toBe('parsedValue');
    });

    it('should return default value if localStorage returns null', () => {
      (Storage.prototype.getItem as jest.Mock).mockReturnValue(null);
      service.parseValue = jest.fn().mockReturnValue('defaultValue');

      const result = service.get('testKey', 'defaultValue');

      expect(Storage.prototype.getItem).toHaveBeenCalledWith('APP_testKey');
      expect(service.parseValue).toHaveBeenCalledWith('APP_testKey', null, 'defaultValue');
      expect(result).toBe('defaultValue');
    });
  });

  describe('observe$', () => {
    it('should emit the current value on subscription', async () => {
      (Storage.prototype.getItem as jest.Mock).mockReturnValue('{"key":"value2"}');
      service.parseValue = jest.fn().mockReturnValueOnce('parsedValue');

      const result = await firstValueFrom(service.observe$('testKey'));

      expect(Storage.prototype.getItem).toHaveBeenCalledWith('APP_testKey');
      expect(service.parseValue).toHaveBeenCalledWith('APP_testKey', '{"key":"value2"}', null);
      expect(result).toBe('parsedValue');
    });

    it('should emit new value when storage event is triggered', async () => {
      service.parseValue = jest.fn().mockReturnValueOnce('initialValue').mockReturnValueOnce('newValue');

      const resultPromise = firstValueFrom(service.observe$('testKey', 'defaultValueTest').pipe(skip(1)));

      window.dispatchEvent(new StorageEvent('storage', { key: 'APP_testKey', newValue: '{"key":"value3"}' }));

      const result = await resultPromise;

      expect(service.parseValue).toHaveBeenCalledWith('APP_testKey', '{"key":"value3"}', 'defaultValueTest');
      expect(result).toBe('newValue');
    });
  });

  describe('set', () => {
    it('should stringify value and save it to localStorage', () => {
      service.set('testKey', { key: 'value' });

      expect(Storage.prototype.setItem).toHaveBeenCalledWith('APP_testKey', JSON.stringify({ key: 'value' }));
    });
  });

  describe('remove', () => {
    it('should remove item from localStorage', () => {
      service.remove('testKey');

      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('APP_testKey');
    });
  });

  describe('parseValue', () => {
    it('should parse JSON string', () => {
      const result = service.parseValue('testKey', '{"key":"value"}');

      expect(result).toEqual({ key: 'value' });
    });

    it('should return default value if parsing fails', () => {
      const result = service.parseValue('testKey', 'invalid JSON', 'defaultValue');

      expect(result).toBe('defaultValue');
    });

    it('should return null if value is null and no default value is provided', () => {
      const result = service.parseValue('testKey', null);

      expect(result).toBeNull();
    });

    it('should return default value if value is null', () => {
      const result = service.parseValue('testKey', null, 'defaultValue');

      expect(result).toBe('defaultValue');
    });
  });
});
