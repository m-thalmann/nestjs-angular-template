import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';

@Component({
  selector: 'app-settings-sublayout',
  imports: [RouterOutlet, Menu],
  templateUrl: './settings-sublayout.component.html',
  styleUrl: './settings-sublayout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSublayoutComponent {
  readonly settingsItems: Array<MenuItem> = [
    {
      separator: true,
    },
    {
      label: 'Profile',
      routerLink: '/settings/profile',
      icon: 'pi pi-user-edit',
    },
  ];
}
