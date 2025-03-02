import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout-auth',
  imports: [RouterOutlet],
  templateUrl: './layout-auth.component.html',
  styleUrl: './layout-auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutAuthComponent {}
