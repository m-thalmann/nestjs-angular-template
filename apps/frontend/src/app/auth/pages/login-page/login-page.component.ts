import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { firstValueFrom } from 'rxjs';
import { AuthDataService } from '../../../common/auth/auth-data.service';
import { handleApiErrorsForForm } from '../../../common/util/form.utils';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, InputTextModule, PasswordModule, IconFieldModule, InputIconModule, ButtonModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authDataService = inject(AuthDataService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loginForm = this.fb.group({
    email: [''],
    password: [''],
  });

  async login(): Promise<void> {
    try {
      await firstValueFrom(
        this.authDataService.login(this.loginForm.controls.email.value, this.loginForm.controls.password.value),
      );
    } catch (e) {
      this.loginForm.markAllAsTouched();
      this.loginForm.controls.password.markAsDirty();
      const errorMessage = handleApiErrorsForForm(e, this.loginForm);
      console.log(errorMessage);
    }
  }
}
