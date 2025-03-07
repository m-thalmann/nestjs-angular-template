import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { AuthInterceptor } from './common/api/auth.interceptor';
import { AuthService } from './common/auth/auth.service';
import { ConfigService } from './common/config/config.service';
import { provideTheme } from './common/theme/theme.provider';

async function setup(): Promise<void> {
  const configService = inject(ConfigService);
  const authService = inject(AuthService);

  await configService.load();

  authService.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAppInitializer(setup),

    provideAnimationsAsync(),
    provideTheme(),

    {
      provide: HTTP_INTERCEPTORS,
      multi: true,
      useClass: AuthInterceptor,
    },
  ],
};
