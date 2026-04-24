import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { MessageService } from 'primeng/api';
import { ResetPasswordRequestComponent } from './reset-password-request.component';

describe('ResetPasswordRequestComponent', () => {
  let component: ResetPasswordRequestComponent;
  let fixture: ComponentFixture<ResetPasswordRequestComponent>;

  let mockAuthService: Partial<AuthService>;
  let mockRouter: Router;
  let mockMessageService: Partial<MessageService>;

  beforeEach(async () => {
    mockAuthService = {
      sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockMessageService = {
      add: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordRequestComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: MessageService, useValue: mockMessageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    mockRouter = TestBed.inject(Router);
    mockRouter.navigateByUrl = jest.fn();
  });

  describe('doRequestReset', () => {
    it('should not call authService if form is invalid', async () => {
      component.form.setValue({ email: '' });
      await component.doRequestReset();
      expect(mockAuthService.sendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('should call authService with email if form is valid', async () => {
      const email = 'test@example.com';
      component.form.setValue({ email });

      await component.doRequestReset();

      expect(mockAuthService.sendResetPasswordEmail).toHaveBeenCalledWith(email);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
      expect(mockMessageService.add).toHaveBeenCalled();
    });

    it('should handle errors from authService', async () => {
      const error = new Error('Network error');
      (mockAuthService.sendResetPasswordEmail as jest.Mock).mockRejectedValue(error);
      component.form.setValue({ email: 'test@example.com' });

      await component.doRequestReset();

      expect(component.errorMessage()).toBe('Network error');
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });
  });
});
