import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { FormFieldComponent } from '@frontend/components';
import { handleApiFormErrors } from '@frontend/util';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { DEFAULT_ROUTE } from '../../../app.routes';
import { AuthLayoutCardComponent } from '../shared/auth-layout-card/auth-layout-card.component';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    AuthLayoutCardComponent,
    FormFieldComponent,
    IconField,
    InputIcon,
    InputText,
    Password,
    Button,
    Divider,
    Message,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly loggingIn = signal(false);
  readonly errorMessage = signal<string | undefined>(undefined);

  async doLogin(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.loggingIn.set(true);
    this.form.disable();
    this.errorMessage.set(undefined);

    const { email, password } = this.form.getRawValue();

    try {
      await this.authService.login({ email, password });
    } catch (error) {
      this.loggingIn.set(false);
      this.form.enable();

      if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized.valueOf()) {
        this.errorMessage.set('Invalid email or password.');
      } else {
        this.errorMessage.set(handleApiFormErrors(error, this.form));
      }

      return;
    }

    await this.router.navigateByUrl(DEFAULT_ROUTE);
  }
}
