import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { handleApiFormErrors } from '@frontend/util';
import { DEFAULT_ROUTE } from '../../../app.routes';
import { LoginComponent } from './login.component';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('@frontend/util', () => ({
  ...jest.requireActual('@frontend/util'),
  handleApiFormErrors: jest.fn(),
}));

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  let mockAuthService: Partial<AuthService>;
  let mockRouter: Router;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    mockRouter = TestBed.inject(Router);
    mockRouter.navigateByUrl = jest.fn();
  });

  describe('doLogin', () => {
    it('should not attempt login if form is invalid', async () => {
      component.form.setValue({ email: '', password: '' });
      await component.doLogin();
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should login and navigate on success', async () => {
      component.form.setValue({ email: 'test@example.com', password: 'password' });
      (mockAuthService.login as jest.Mock).mockResolvedValueOnce(undefined);

      await component.doLogin();

      expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
      expect(component.errorMessage()).toBeUndefined();
      expect(component.loggingIn()).toBe(false);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });

    it('should set error message on login failure', async () => {
      component.form.setValue({ email: 'test@example.com', password: 'password' });
      const mockError = new Error('Login failed');
      (mockAuthService.login as jest.Mock).mockRejectedValueOnce(mockError);
      (handleApiFormErrors as jest.Mock).mockReturnValueOnce('Mock error');

      await component.doLogin();

      expect(handleApiFormErrors).toHaveBeenCalledWith(mockError, expect.anything());
      expect(component.errorMessage()).toBe('Mock error');
      expect(component.loggingIn()).toBe(false);
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should set specific error message on unauthorized error', async () => {
      component.form.setValue({ email: 'test@example.com', password: 'password' });
      const mockError = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      (mockAuthService.login as jest.Mock).mockRejectedValueOnce(mockError);

      await component.doLogin();

      expect(component.errorMessage()).toBe('Invalid email or password.');
      expect(component.loggingIn()).toBe(false);
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });
  });
});
