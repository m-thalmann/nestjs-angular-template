import { Route } from '@angular/router';
import { LayoutAuthComponent } from './layouts/layout-auth/layout-auth.component';

export const DEFAULT_ROUTE = '/home';

export const appRoutes: Array<Route> = [
  { path: '', pathMatch: 'full', redirectTo: DEFAULT_ROUTE },

  { path: 'auth', component: LayoutAuthComponent, loadChildren: async () => await import('./auth/auth.routes') },
  {
    path: 'login',
    redirectTo: 'auth/login',
  },
  {
    path: 'signup',
    redirectTo: 'auth/signup',
  },
];
