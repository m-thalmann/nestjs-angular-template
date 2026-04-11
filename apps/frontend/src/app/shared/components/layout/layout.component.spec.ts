import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { createMatchMediaMock } from '@frontend/testing';
import { Theme, ThemeService } from '@frontend/theme';
import { BehaviorSubject } from 'rxjs';
import { LayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  let mockThemeService: Partial<ThemeService>;

  beforeEach(async () => {
    mockThemeService = {
      currentTheme$: new BehaviorSubject(Theme.System),
      setTheme: jest.fn(),
    };

    createMatchMediaMock(false);

    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [provideRouter([]), { provide: ThemeService, useValue: mockThemeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('userMenu', () => {
    it('should contain menu items', () => {
      const menuItems = component.userMenu();

      expect(menuItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'Settings' }),
          expect.objectContaining({ label: 'Theme' }),
          expect.objectContaining({ label: 'About' }),
          expect.objectContaining({ label: 'Administration' }), // TODO: add extra test when user loaded from service
          expect.objectContaining({ label: 'Logout' }),
        ]),
      );
    });

    it.each(Object.values(Theme))(
      'should contain theme items with correct icons (current theme: %s)',
      (currentTheme) => {
        (mockThemeService.currentTheme$ as BehaviorSubject<Theme>).next(currentTheme);

        const themeMenuItem = component.userMenu().find((item) => item.label === 'Theme');
        expect(themeMenuItem?.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              label: 'System',
              icon: currentTheme === Theme.System ? 'pi pi-check' : 'pi pi-desktop',
            }),
            expect.objectContaining({
              label: 'Dark',
              icon: currentTheme === Theme.Dark ? 'pi pi-check' : 'pi pi-moon',
            }),
            expect.objectContaining({
              label: 'Light',
              icon: currentTheme === Theme.Light ? 'pi pi-check' : 'pi pi-sun',
            }),
          ]),
        );
      },
    );

    it.each(Object.values(Theme))('should call setTheme with correct theme when theme item clicked (%s)', (theme) => {
      const themeMenuItem = component.userMenu().find((item) => item.label === 'Theme');
      const themeOption = themeMenuItem?.items?.find((item) => item.automationId === `theme-${theme}-item`);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      themeOption!.command!({});

      expect(mockThemeService.setTheme).toHaveBeenCalledWith(theme);
    });
  });
});
