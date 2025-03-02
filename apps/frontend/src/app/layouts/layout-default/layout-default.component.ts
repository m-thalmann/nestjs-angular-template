import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout-default',
  imports: [RouterOutlet],
  templateUrl: './layout-default.component.html',
  styleUrl: './layout-default.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutDefaultComponent {}
