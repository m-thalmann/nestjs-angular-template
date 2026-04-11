import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Theme, ThemeService } from '@frontend/theme';
import { DetailedUser, Role } from '@shared/api-interfaces';
import { objectEntries } from '@shared/common';
import { MenuItem } from 'primeng/api';
import { Avatar } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { TieredMenu } from 'primeng/tieredmenu';
import { NavItemComponent } from './nav-item/nav-item.component';

const Themes = {
  [Theme.System]: { label: 'System', icon: 'pi pi-desktop' },
  [Theme.Dark]: { label: 'Dark', icon: 'pi pi-moon' },
  [Theme.Light]: { label: 'Light', icon: 'pi pi-sun' },
} satisfies Record<Theme, { label: string; icon: string }>;

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, Avatar, TieredMenu, NavItemComponent, Button],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  private readonly themeService = inject(ThemeService);

  protected readonly authUser = signal<DetailedUser>({
    uuid: '',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: Role.Admin,
    isEmailVerified: true,
    createdAt: 0,
    updatedAt: 0,
  });
  protected readonly currentTheme = toSignal(this.themeService.currentTheme$);

  readonly userMenu = computed<Array<MenuItem>>(() => {
    const authUser = this.authUser();
    const currentTheme = this.currentTheme();

    return [
      { label: 'Settings', icon: 'pi pi-cog', routerLink: '/settings' },
      {
        label: 'Theme',
        icon: 'pi pi-palette',
        items: objectEntries(Themes).map<MenuItem>(([theme, { label, icon }]) => ({
          label,
          automationId: `theme-${theme}-item`,
          icon: theme === currentTheme ? 'pi pi-check' : icon,
          iconStyle: theme === currentTheme ? { color: 'var(--p-primary-color)' } : undefined,
          command: () => this.setTheme(theme),
        })),
      },
      { label: 'About', icon: 'pi pi-info-circle', command: this.openAbout },
      ...(authUser.role === Role.Admin
        ? [{ separator: true }, { label: 'Administration', icon: 'pi pi-shield', routerLink: '/admin' }]
        : []),
      { separator: true },
      { label: 'Logout', icon: 'pi pi-sign-out', command: this.doLogout },
    ];
  });

  protected setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  protected openAbout(): void {
    // TODO: implement
  }

  protected doLogout(): void {
    // TODO: implement
  }
}
