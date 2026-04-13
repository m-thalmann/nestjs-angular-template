import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { DEFAULT_ROUTE } from '@frontend/constants';
import { getApiErrorMessage } from '@frontend/util';
import { isDefined } from '@shared/common';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { Message } from 'primeng/message';
import { filter, map } from 'rxjs';
import { AuthLayoutCardComponent } from '../../shared/auth-layout-card/auth-layout-card.component';

@Component({
  selector: 'app-verify-email-confirm',
  imports: [AuthLayoutCardComponent, Message, ButtonDirective, Divider, RouterLink],
  templateUrl: './verify-email-confirm.component.html',
  styleUrl: './verify-email-confirm.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailConfirmComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly verificationToken$ = this.activatedRoute.paramMap.pipe(
    map((params) => params.get('token') ?? undefined),
  );

  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.verificationToken$.pipe(filter(isDefined), takeUntilDestroyed()).subscribe((token) => {
      this.verifyEmail(token);
    });
  }

  protected async verifyEmail(token: string): Promise<void> {
    try {
      await this.authService.verifyEmail(token);

      this.messageService.add({
        severity: 'success',
        summary: 'Email Verified',
        detail: 'Your email has been successfully verified.',
      });
      this.router.navigateByUrl(DEFAULT_ROUTE);
    } catch (error) {
      this.errorMessage.set(`Failed to verify email. ${getApiErrorMessage(error)}`);
    }
  }
}
