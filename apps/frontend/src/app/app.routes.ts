import { Route } from '@angular/router';
import { authGuard, guestGuard } from '@frontend/auth';
import { LayoutComponent } from '@frontend/components';
import { LoginComponent } from './features/auth/login/login.component';
import { AuthLayoutComponent } from './features/auth/shared/auth-layout/auth-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const appRoutes: Array<Route> = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },

      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        component: LoginComponent,
      },
    ],
  },
];
