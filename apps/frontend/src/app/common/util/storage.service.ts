import { inject, Injectable, InjectionToken } from '@angular/core';
import { getErrorMessage } from './error.utils';
import { Logger } from './logger';

export const STORAGE_IMPLEMENTATION = new InjectionToken<Storage>('STORAGE_IMPLEMENTATION', {
  factory: () => localStorage,
});

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  protected static readonly PREFIX = 'APP_';

  protected readonly storage = inject(STORAGE_IMPLEMENTATION);
  protected readonly logger = new Logger(StorageService.name);

  get<T>(key: string, defaultValue: T | null = null): T | null {
    const value = this.storage.getItem(StorageService.generateKey(key));

    if (value !== null) {
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        this.logger.error(Storage.name, `Error parsing value for key '${key}': ${getErrorMessage(e)}`);
      }
    }

    return defaultValue;
  }

  set(key: string, value: unknown): void {
    this.storage.setItem(StorageService.generateKey(key), JSON.stringify(value));
  }

  remove(key: string): void {
    this.storage.removeItem(StorageService.generateKey(key));
  }

  protected static generateKey(key: string): string {
    return StorageService.PREFIX + key;
  }
}
