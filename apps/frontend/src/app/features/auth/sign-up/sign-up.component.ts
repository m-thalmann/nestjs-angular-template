import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { FormFieldComponent } from '@frontend/components';
import { handleApiFormErrors } from '@frontend/util';
import { AppValidators } from '@frontend/validation';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { AuthLayoutCardComponent } from '../shared/auth-layout-card/auth-layout-card.component';

@Component({
  selector: 'app-sign-up',
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
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [AppValidators.passwordsMatch('password', 'confirmPassword')] },
  );

  readonly signingUp = signal(false);
  readonly errorMessage = signal<string | undefined>(undefined);

  async doSignUp(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.signingUp.set(true);
    this.form.disable();
    this.errorMessage.set(undefined);

    const { name, email, password } = this.form.getRawValue();

    try {
      await this.authService.signUp({ name, email, password });
    } catch (error) {
      this.signingUp.set(false);
      this.form.enable();

      this.errorMessage.set(handleApiFormErrors(error, this.form));

      return;
    }

    await this.router.navigateByUrl('/verify-email');

    this.messageService.add({
      severity: 'success',
      summary: 'Sign-Up Successful',
      detail: 'Your account has been created. Please check your email to verify your account before continuing.',
    });
  }
}
