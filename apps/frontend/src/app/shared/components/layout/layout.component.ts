import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { objectEntries, ObjectValues } from '@shared/common';
import { MenuItem } from 'primeng/api';
import { Avatar } from 'primeng/avatar';
import { TieredMenu } from 'primeng/tieredmenu';

// TODO: move type to theme service
const Theme = {
  System: 'system',
  Dark: 'dark',
  Light: 'light',
} as const;

type Theme = ObjectValues<typeof Theme>;

const Themes = {
  [Theme.System]: { label: 'System', icon: 'pi pi-desktop' },
  [Theme.Dark]: { label: 'Dark', icon: 'pi pi-moon' },
  [Theme.Light]: { label: 'Light', icon: 'pi pi-sun' },
} satisfies Record<Theme, { label: string; icon: string }>;

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, Avatar, TieredMenu],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  protected readonly currentTheme = signal<Theme>(Theme.System);

  readonly userMenu = computed<Array<MenuItem>>(() => {
    const currentTheme = this.currentTheme();

    return [
      { label: 'Settings', icon: 'pi pi-cog', routerLink: '/settings' },
      { label: 'Administration', icon: 'pi pi-shield', routerLink: '/admin' },
      {
        label: 'Theme',
        icon: 'pi pi-palette',
        items: objectEntries(Themes).map(([theme, { label, icon }]) => ({
          label,
          icon: theme === currentTheme ? 'pi pi-check' : icon,
          iconStyle: theme === currentTheme ? { color: 'var(--p-primary-color)' } : undefined,
          command: () => this.setTheme(theme),
        })),
      },
      { label: 'About', icon: 'pi pi-info-circle', command: this.openAbout },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: this.doLogout,
        iconStyle: { color: 'var(--color-error)' },
        labelStyle: { color: 'var(--color-error)' },
      },
    ];
  });

  protected setTheme(_theme: Theme): void {
    // TODO: implement
  }

  protected openAbout(): void {
    // TODO: implement
  }

  protected doLogout(): void {
    // TODO: implement
  }
}
