import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  imports: [RouterOutlet, ToastModule],
  selector: 'app-root',
  template: `<router-outlet /> <p-toast />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
