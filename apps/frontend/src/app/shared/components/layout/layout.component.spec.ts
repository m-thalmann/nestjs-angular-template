import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { createMatchMediaMock, createMockDetailedUser } from '@frontend/testing';
import { Theme, ThemeService } from '@frontend/theme';
import { DetailedUser, Role } from '@shared/api-interfaces';
import { MessageService } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';
import { LayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  let mockAuthService: Partial<AuthService>;
  let mockThemeService: Partial<ThemeService>;
  let mockMessageService: Partial<MessageService>;

  beforeEach(async () => {
    mockAuthService = {
      authUser$: new BehaviorSubject(null),
      logout: jest.fn().mockResolvedValue(undefined),
    };

    mockThemeService = {
      currentTheme$: new BehaviorSubject(Theme.System),
      setTheme: jest.fn(),
    };

    mockMessageService = {
      add: jest.fn(),
    };

    createMatchMediaMock(false);

    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideRouter([{ path: 'login', redirectTo: '' }]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: MessageService, useValue: mockMessageService },
      ],
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
          expect.not.objectContaining({ label: 'Administration' }),
          expect.objectContaining({ label: 'Logout' }),
        ]),
      );
    });

    it('should contain Administration item for admin users', () => {
      (mockAuthService.authUser$ as BehaviorSubject<DetailedUser>).next(createMockDetailedUser({ role: Role.Admin }));

      const menuItems = component.userMenu();

      expect(menuItems).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'Administration' })]));
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

    it('should logout when logout item clicked', async () => {
      const logoutMenuItem = component.userMenu().find((item) => item.label === 'Logout');

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-confusing-void-expression
      await (logoutMenuItem!.command!({}) as unknown as Promise<void>);

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockMessageService.add).toHaveBeenCalled();
    });
  });
});
