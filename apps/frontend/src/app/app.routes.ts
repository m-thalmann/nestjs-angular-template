import { Route } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const appRoutes: Array<Route> = [{ path: '', component: LayoutComponent, children: [] }];
