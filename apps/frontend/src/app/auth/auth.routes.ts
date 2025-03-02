import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';

const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginPageComponent,
  },
];

export default AUTH_ROUTES;
