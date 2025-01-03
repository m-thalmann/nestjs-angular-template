import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { getErrorMessage } from '../util/error.utils';
import { Config } from './config.model';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  static readonly API_URL: string = 'assets/config.json';

  private readonly httpClient: HttpClient = inject(HttpClient);

  protected _config: Config | null = null;

  get config(): Config {
    if (this._config === null) {
      throw new Error('Config not loaded');
    }

    return this._config;
  }

  async load(): Promise<void> {
    try {
      const config = await firstValueFrom(this.httpClient.get<Config>(ConfigService.API_URL));

      this._config = config;
    } catch (e) {
      throw new Error(`Failed to load config: ${getErrorMessage(e)}`);
    }
  }
}
