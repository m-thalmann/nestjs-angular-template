import { Route } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const DEFAULT_ROUTE = '/dashboard';

export const appRoutes: Array<Route> = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },

      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
];
