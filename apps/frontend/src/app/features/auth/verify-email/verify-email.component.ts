import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { AuthLayoutCardComponent } from '../shared/auth-layout-card/auth-layout-card.component';

@Component({
  selector: 'app-verify-email',
  imports: [ReactiveFormsModule, AuthLayoutCardComponent, Button, Divider],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly authUser = toSignal(this.authService.authUser$);

  readonly resendingEmail = signal(false);

  async resendVerificationEmail(): Promise<void> {
    this.resendingEmail.set(true);

    try {
      await this.authService.resendVerificationEmail();
      this.messageService.add({
        severity: 'success',
        summary: 'Verification Email Sent',
        detail: 'Please check your email for the verification link.',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to resend verification email. Please try again later.',
      });
    } finally {
      this.resendingEmail.set(false);
    }
  }

  async goBackToLogin(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login');
  }
}
