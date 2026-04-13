import { Route } from '@angular/router';
import {
  authGuard,
  guestGuard,
  ROUTE_EXPECTED_EMAIL_VERIFICATION_STATUS,
  RouteExpectedEmailVerificationStatus,
} from '@frontend/auth';
import { LayoutComponent } from '@frontend/components';
import { LoginComponent } from './features/auth/login/login.component';
import { AuthLayoutComponent } from './features/auth/shared/auth-layout/auth-layout.component';
import { SignUpComponent } from './features/auth/sign-up/sign-up.component';
import { VerifyEmailConfirmComponent } from './features/auth/verify-email/verify-email-confirm/verify-email-confirm.component';
import { VerifyEmailComponent } from './features/auth/verify-email/verify-email.component';
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
      {
        path: 'sign-up',
        canActivate: [guestGuard],
        component: SignUpComponent,
      },
      {
        path: 'verify-email',
        canActivate: [authGuard],
        data: {
          [ROUTE_EXPECTED_EMAIL_VERIFICATION_STATUS]: RouteExpectedEmailVerificationStatus.Unverified,
        },
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: VerifyEmailComponent,
          },
          {
            path: ':token',
            component: VerifyEmailConfirmComponent,
          },
        ],
      },
    ],
  },
];
