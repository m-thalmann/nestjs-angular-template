import { Injectable } from '@angular/core';
import { Logger } from '@frontend/util';
import { getErrorMessage } from '@shared/common';
import { filter, fromEvent, map, Observable, shareReplay, startWith } from 'rxjs';

const PREFIX = 'APP_';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  protected readonly logger = Logger.create(StorageService);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  get<T>(key: string): T | null;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue: T | null = null): T | null {
    const generatedKey = this.generateKey(key);

    const value = localStorage.getItem(generatedKey);

    return this.parseValue<T>(generatedKey, value, defaultValue);
  }

  /**
   * Observes the value change of a key in localStorage.
   * When subscribed, it emits the current value
   *
   * __Important:__ The value is only observed if the value is changed in another tab.
   */
  observe$<T>(key: string): Observable<T | null>;
  observe$<T>(key: string, defaultValue: T): Observable<T>;
  observe$<T>(key: string, defaultValue: T | null = null): Observable<T | null> {
    const generatedKey = this.generateKey(key);

    return fromEvent<StorageEvent>(window, 'storage').pipe(
      filter((event) => event.key === generatedKey),
      map((event) => event.newValue),
      startWith(localStorage.getItem(generatedKey)),
      map((value) => this.parseValue<T>(generatedKey, value, defaultValue)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  set(key: string, value: unknown): void {
    localStorage.setItem(this.generateKey(key), JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(this.generateKey(key));
  }

  protected generateKey(key: string): string {
    return PREFIX + key;
  }

  protected parseValue<T>(key: string, value: string | null, defaultValue: T | null = null): T | null {
    if (value !== null) {
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        this.logger.error(`Error parsing value for key '${key}': ${getErrorMessage(e)}`);
      }
    }

    return defaultValue;
  }
}
