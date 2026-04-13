import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { MessageService } from 'primeng/api';
import { SignUpComponent } from './sign-up.component';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;

  let mockAuthService: Partial<AuthService>;
  let mockRouter: Router;
  let mockMessageService: Partial<MessageService>;

  beforeEach(async () => {
    mockAuthService = {
      signUp: jest.fn(),
    };

    mockMessageService = {
      add: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SignUpComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: MessageService, useValue: mockMessageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    mockRouter = TestBed.inject(Router);
    mockRouter.navigateByUrl = jest.fn();
  });

  describe('doSignUp', () => {
    it('should not call signUp if form is invalid', async () => {
      component.form.setValue({
        name: '',
        email: 'invalid-email',
        password: '',
        confirmPassword: '',
      });

      await component.doSignUp();

      expect(mockAuthService.signUp).not.toHaveBeenCalled();
    });

    it('should call signUp and navigate on success', async () => {
      const formData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
      };

      component.form.setValue(formData);

      (mockAuthService.signUp as jest.Mock).mockResolvedValue(undefined);

      await component.doSignUp();

      expect(mockAuthService.signUp).toHaveBeenCalledWith({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/verify-email');
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        summary: expect.any(String),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        detail: expect.any(String),
      });
    });

    it('should handle errors correctly', async () => {
      const formData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
      };

      component.form.setValue(formData);

      (mockAuthService.signUp as jest.Mock).mockRejectedValue(new Error('Mock Error'));

      await component.doSignUp();

      expect(component.errorMessage()).toBe('Mock Error');
      expect(component.form.enabled).toBe(true);
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
      expect(mockMessageService.add).not.toHaveBeenCalled();
    });
  });
});
