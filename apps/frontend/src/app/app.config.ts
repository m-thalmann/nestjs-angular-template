import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { ConfigService } from './common/config/config.service';

async function waitForConfigLoaded(): Promise<void> {
  const configService = inject(ConfigService);

  await configService.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(),
    provideAppInitializer(waitForConfigLoaded),
  ],
};
