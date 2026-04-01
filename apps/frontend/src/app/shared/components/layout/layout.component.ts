import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Avatar } from 'primeng/avatar';
import { Toolbar } from 'primeng/toolbar';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Toolbar, Avatar],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {}
