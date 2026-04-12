import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StorageService } from '@frontend/services';
import { distinctUntilChanged, fromEvent, map, merge, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { DARK_THEME_CLASS, Theme } from './theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  protected static readonly THEME_STORAGE_KEY = 'THEME';
  protected static readonly DARK_SCHEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

  private readonly storageService = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly navigatorTheme$ = fromEvent<MediaQueryList>(
    window.matchMedia(ThemeService.DARK_SCHEME_MEDIA_QUERY),
    'change',
  ).pipe(
    startWith(window.matchMedia(ThemeService.DARK_SCHEME_MEDIA_QUERY)),
    map((event) => (event.matches ? Theme.Dark : Theme.Light)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected readonly themeSelected$ = new Subject<Theme>();

  readonly currentTheme$ = merge(
    this.themeSelected$,
    this.storageService.observe$<Theme>(ThemeService.THEME_STORAGE_KEY, Theme.System),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  initialize(): void {
    this.currentTheme$
      .pipe(
        switchMap((theme) => (theme === Theme.System ? this.navigatorTheme$ : [theme])),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((theme) => {
        document.documentElement.classList.toggle(DARK_THEME_CLASS, theme === Theme.Dark);
      });
  }

  setTheme(theme: Theme): void {
    this.storageService.set(ThemeService.THEME_STORAGE_KEY, theme);
    this.themeSelected$.next(theme);
  }
}
