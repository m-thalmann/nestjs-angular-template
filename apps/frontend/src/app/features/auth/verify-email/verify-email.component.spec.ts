import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { createMockDetailedUser } from '@frontend/testing';
import { MessageService } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';
import { VerifyEmailComponent } from './verify-email.component';

describe('VerifyEmailComponent', () => {
  let component: VerifyEmailComponent;
  let fixture: ComponentFixture<VerifyEmailComponent>;

  let mockAuthService: Partial<AuthService>;
  let mockRouter: Partial<Router>;
  let mockMessageService: Partial<MessageService>;

  beforeEach(async () => {
    mockAuthService = {
      authUser$: new BehaviorSubject(createMockDetailedUser({ isEmailVerified: false })),
      resendVerificationEmail: jest.fn(),
      logout: jest.fn(),
    };

    mockRouter = {
      navigateByUrl: jest.fn(),
    };

    mockMessageService = {
      add: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: MessageService, useValue: mockMessageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email successfully', async () => {
      (mockAuthService.resendVerificationEmail as jest.Mock).mockResolvedValueOnce(undefined);

      await component.resendVerificationEmail();

      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalled();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        summary: expect.any(String),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        detail: expect.any(String),
      });
    });

    it('should handle error when resending verification email fails', async () => {
      (mockAuthService.resendVerificationEmail as jest.Mock).mockRejectedValueOnce(new Error('Failed to resend email'));

      await component.resendVerificationEmail();

      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalled();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        summary: expect.any(String),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        detail: expect.any(String),
      });
    });
  });

  describe('goBackToLogin', () => {
    it('should log out and navigate to login page', async () => {
      (mockAuthService.logout as jest.Mock).mockResolvedValueOnce(undefined);
      (mockRouter.navigateByUrl as jest.Mock).mockResolvedValueOnce(true);

      await component.goBackToLogin();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
    });
  });
});
