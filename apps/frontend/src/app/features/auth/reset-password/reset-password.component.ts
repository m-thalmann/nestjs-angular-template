import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { FormFieldComponent } from '@frontend/components';
import { getApiErrorMessage, handleApiFormErrors } from '@frontend/util';
import { AppValidators } from '@frontend/validation';
import { isDefined, isUndefined } from '@shared/common';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { catchError, filter, firstValueFrom, map, of, switchMap, tap } from 'rxjs';
import { AuthLayoutCardComponent } from '../shared/auth-layout-card/auth-layout-card.component';

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    AuthLayoutCardComponent,
    FormFieldComponent,
    IconField,
    InputIcon,
    Password,
    Button,
    Message,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly resetToken$ = this.activatedRoute.paramMap.pipe(map((params) => params.get('token') ?? undefined));

  readonly tokenValidating = signal(true);

  protected readonly tokenValidationError$ = this.resetToken$.pipe(
    filter(isDefined),
    tap(() => this.tokenValidating.set(true)),
    switchMap(async (token) => await this.authService.validateResetPasswordToken(token)),
    map(() => undefined),
    catchError((error: unknown) => of(getApiErrorMessage(error))),
    tap(() => this.tokenValidating.set(false)),
  );
  readonly tokenValidationError = toSignal(this.tokenValidationError$);

  readonly form = this.fb.group(
    {
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [AppValidators.passwordsMatch('password', 'confirmPassword')] },
  );

  readonly resetting = signal(false);
  readonly errorMessage = signal<string | undefined>(undefined);

  async doResetPassword(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const token = await firstValueFrom(this.resetToken$);

    if (isUndefined(token)) {
      return;
    }

    this.resetting.set(true);
    this.form.disable();
    this.errorMessage.set(undefined);

    const { password } = this.form.getRawValue();

    try {
      await this.authService.resetPassword(token, password);
    } catch (error) {
      this.resetting.set(false);
      this.form.enable();

      this.errorMessage.set(handleApiFormErrors(error, this.form));

      return;
    }

    await this.router.navigateByUrl('/login');

    this.messageService.add({
      severity: 'success',
      summary: 'Password Reset Successful',
      detail: 'Your password has been reset successfully. You can now log in with your new password.',
    });
  }
}
