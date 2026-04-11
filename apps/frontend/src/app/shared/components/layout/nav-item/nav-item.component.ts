import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonDirective, ButtonLabel } from 'primeng/button';

@Component({
  selector: 'app-nav-item',
  imports: [ButtonDirective, ButtonLabel, RouterLink, RouterLinkActive],
  templateUrl: './nav-item.component.html',
  styleUrl: './nav-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavItemComponent {
  readonly link = input.required<string | Array<string>>();
  readonly label = input.required<string>();

  readonly isActiveLink = signal(false);
}
