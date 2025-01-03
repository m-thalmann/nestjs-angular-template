import { Injectable } from '@angular/core';
import { getErrorMessage } from './error.utils';
import { Logger } from './logger';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  protected static readonly PREFIX: string = 'APP_';

  protected readonly logger: Logger = new Logger(StorageService.name);

  constructor(private readonly storage: Storage = localStorage) {}

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
