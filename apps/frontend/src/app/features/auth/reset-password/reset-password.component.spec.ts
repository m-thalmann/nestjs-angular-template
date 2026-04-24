import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { promiseTimesOut } from '@frontend/testing';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, firstValueFrom, map, Observable } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  let mockAuthService: Partial<AuthService>;
  let mockRouter: Partial<Router>;
  let mockMessageService: Partial<MessageService>;
  let mockActivatedRouteParamMap$: BehaviorSubject<Record<string, string>>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  beforeEach(async () => {
    mockAuthService = {
      validateResetPasswordToken: jest.fn(),
      resetPassword: jest.fn(),
    };

    mockRouter = {
      navigateByUrl: jest.fn(),
    };

    mockMessageService = {
      add: jest.fn(),
    };

    mockActivatedRouteParamMap$ = new BehaviorSubject({});

    mockActivatedRoute = {
      // eslint-disable-next-line rxjs/finnish
      paramMap: mockActivatedRouteParamMap$.pipe(map((params) => convertToParamMap(params))),
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: MessageService, useValue: mockMessageService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('tokenValidationError$', () => {
    let componentTokenValidationError$: Observable<string | undefined>;

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      componentTokenValidationError$ = component['tokenValidationError$'];
    });

    it('should not emit if token is not provided', async () => {
      const resultPromise = firstValueFrom(componentTokenValidationError$);

      await expect(promiseTimesOut(resultPromise)).resolves.toBe(true);
    });

    it('should validate token and emit error message when token is invalid', async () => {
      const token = 'invalid-token';
      const errorMessage = 'Invalid token';
      mockAuthService.validateResetPasswordToken = jest.fn().mockRejectedValue(new Error(errorMessage));

      mockActivatedRouteParamMap$.next({ token });

      const result = await firstValueFrom(componentTokenValidationError$);

      expect(result).toBe(errorMessage);
      expect(mockAuthService.validateResetPasswordToken).toHaveBeenCalledWith(token);
    });

    it('should validate token and emit undefined when token is valid', async () => {
      const token = 'valid-token';
      mockAuthService.validateResetPasswordToken = jest.fn().mockResolvedValue(undefined);

      mockActivatedRouteParamMap$.next({ token });

      const result = await firstValueFrom(componentTokenValidationError$);

      expect(result).toBeUndefined();
      expect(mockAuthService.validateResetPasswordToken).toHaveBeenCalledWith(token);
    });
  });

  describe('doResetPassword', () => {
    it('should not call resetPassword if form is invalid', async () => {
      component.form.setErrors({ invalid: true });

      await component.doResetPassword();

      expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
    });

    it('should not call resetPassword if token is undefined', async () => {
      await component.doResetPassword();

      expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
    });

    it('should call resetPassword with token and password', async () => {
      const token = 'valid-token';
      const password = 'new-password';
      mockActivatedRouteParamMap$.next({ token });
      component.form.setValue({ password, confirmPassword: password });

      await component.doResetPassword();

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(token, password);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
      expect(mockMessageService.add).toHaveBeenCalled();
    });

    it('should handle error when resetPassword fails', async () => {
      const token = 'valid-token';
      const password = 'new-password';
      const errorMessage = 'Reset password failed';
      mockActivatedRouteParamMap$.next({ token });
      component.form.setValue({ password, confirmPassword: password });
      mockAuthService.resetPassword = jest.fn().mockRejectedValue(new Error(errorMessage));

      await component.doResetPassword();

      expect(component.errorMessage()).toBe(errorMessage);
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
      expect(mockMessageService.add).not.toHaveBeenCalled();
    });
  });
});
