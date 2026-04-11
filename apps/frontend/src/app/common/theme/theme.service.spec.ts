import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StorageService } from '@frontend/services';
import { createMatchMediaMock } from '@frontend/testing';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { DARK_THEME_CLASS, Theme } from './theme';
import { ThemeService } from './theme.service';

@Injectable()
class ThemeServiceTestClass extends ThemeService {
  _getThemeStorageKey(): string {
    return ThemeService.THEME_STORAGE_KEY;
  }

  _getDarkSchemeMediaQuery(): string {
    return ThemeService.DARK_SCHEME_MEDIA_QUERY;
  }

  _getNavigatorTheme$(): typeof this.navigatorTheme$ {
    return this.navigatorTheme$;
  }
}

describe('ThemeService', () => {
  let service: ThemeServiceTestClass;

  let mockStorageService: Partial<StorageService>;
  let mockStorageObserveTheme$: BehaviorSubject<Theme>;

  let getMockMediaQueryChangeListener: () => ((event: { matches: boolean }) => void) | null;

  beforeEach(() => {
    ({ getListener: getMockMediaQueryChangeListener } = createMatchMediaMock(false));

    mockStorageObserveTheme$ = new BehaviorSubject<Theme>(Theme.System);

    mockStorageService = {
      // eslint-disable-next-line rxjs/finnish
      observe$: jest.fn().mockReturnValue(mockStorageObserveTheme$),
      set: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [ThemeServiceTestClass, { provide: StorageService, useValue: mockStorageService }],
    });
    service = TestBed.inject(ThemeServiceTestClass);
  });

  afterEach(() => {
    document.documentElement.classList.remove(DARK_THEME_CLASS);
  });

  describe('navigatorTheme$', () => {
    it('should emit the correct theme based on current media query state', async () => {
      const navigatorTheme = await firstValueFrom(service._getNavigatorTheme$());

      expect(navigatorTheme).toBe(Theme.Light);
      expect(window.matchMedia).toHaveBeenCalledWith(service._getDarkSchemeMediaQuery());
    });

    it('should emit the correct theme when media query changes', async () => {
      getMockMediaQueryChangeListener()?.({ matches: true });

      const navigatorTheme = await firstValueFrom(service._getNavigatorTheme$());

      expect(navigatorTheme).toBe(Theme.Dark);
    });
  });

  describe('currentTheme$', () => {
    it('should emit the theme from storage service', async () => {
      const expectedTheme = Theme.Dark;
      mockStorageObserveTheme$.next(expectedTheme);

      const currentTheme = await firstValueFrom(service.currentTheme$);

      expect(currentTheme).toBe(expectedTheme);
      expect(mockStorageService.observe$).toHaveBeenCalledWith(service._getThemeStorageKey(), Theme.System);
    });

    it('should emit the selected theme when setTheme is called', async () => {
      expect(await firstValueFrom(service.currentTheme$)).toBe(Theme.System);

      const expectedTheme = Theme.Dark;
      service.setTheme(expectedTheme);

      const currentTheme = await firstValueFrom(service.currentTheme$);

      expect(currentTheme).toBe(expectedTheme);
    });
  });

  describe('theme application', () => {
    it('should apply the correct theme class to document element', async () => {
      expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBe(false);

      service.setTheme(Theme.Dark);
      await firstValueFrom(service.currentTheme$);

      expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBe(true);

      service.setTheme(Theme.Light);
      await firstValueFrom(service.currentTheme$);

      expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBe(false);
    });

    it('should apply the correct theme class based on media query when theme is set to system', async () => {
      service.setTheme(Theme.System);
      await firstValueFrom(service.currentTheme$);

      expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBe(false);

      getMockMediaQueryChangeListener()?.({ matches: true });
      await firstValueFrom(service.currentTheme$);

      expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBe(true);
    });
  });

  describe('setTheme', () => {
    it('should update the theme in storage service', () => {
      const expectedTheme = Theme.Dark;
      service.setTheme(expectedTheme);

      expect(mockStorageService.set).toHaveBeenCalledWith(service._getThemeStorageKey(), expectedTheme);
    });
  });
});
