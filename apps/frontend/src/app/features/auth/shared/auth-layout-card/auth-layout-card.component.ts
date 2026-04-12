import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-auth-layout-card',
  imports: [Card],
  templateUrl: './auth-layout-card.component.html',
  styleUrl: './auth-layout-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutCardComponent {
  readonly title = input<string>();
  readonly subtitle = input<string>();
}
