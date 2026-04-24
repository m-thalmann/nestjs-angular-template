import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { FormFieldComponent } from '@frontend/components';
import { handleApiFormErrors } from '@frontend/util';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { AuthLayoutCardComponent } from '../../shared/auth-layout-card/auth-layout-card.component';

@Component({
  selector: 'app-reset-password-request',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    AuthLayoutCardComponent,
    FormFieldComponent,
    IconField,
    InputIcon,
    InputText,
    Button,
    Divider,
    Message,
  ],
  templateUrl: './reset-password-request.component.html',
  styleUrl: './reset-password-request.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordRequestComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly requestingReset = signal(false);
  readonly errorMessage = signal<string | undefined>(undefined);

  async doRequestReset(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.requestingReset.set(true);
    this.form.disable();
    this.errorMessage.set(undefined);

    const { email } = this.form.getRawValue();

    try {
      await this.authService.sendResetPasswordEmail(email);
    } catch (error) {
      this.requestingReset.set(false);
      this.form.enable();

      this.errorMessage.set(handleApiFormErrors(error, this.form));

      return;
    }

    await this.router.navigateByUrl('/login');

    this.messageService.add({
      severity: 'success',
      summary: 'Password Reset Requested',
      detail: 'Please check your email for instructions to reset your password.',
    });
  }
}
