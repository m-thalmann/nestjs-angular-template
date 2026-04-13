import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { DEFAULT_ROUTE } from '@frontend/constants';
import { MessageService } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';
import { VerifyEmailConfirmComponent } from './verify-email-confirm.component';

describe('VerifyEmailConfirmComponent', () => {
  let component: VerifyEmailConfirmComponent;
  let fixture: ComponentFixture<VerifyEmailConfirmComponent>;

  let mockAuthService: Partial<AuthService>;
  let mockRouter: Partial<Router>;
  let mockMessageService: Partial<MessageService>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  beforeEach(async () => {
    mockAuthService = {
      verifyEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockRouter = {
      navigateByUrl: jest.fn(),
    };

    mockMessageService = {
      add: jest.fn(),
    };

    mockActivatedRoute = {
      // eslint-disable-next-line rxjs/finnish
      paramMap: new BehaviorSubject<ParamMap>(convertToParamMap({})),
    };

    await TestBed.configureTestingModule({
      imports: [VerifyEmailConfirmComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: MessageService, useValue: mockMessageService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmailConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('verifyEmail', () => {
    it('should verify email with token from active route and navigate to default route', async () => {
      const token = 'test-token';
      (mockActivatedRoute.paramMap as BehaviorSubject<ParamMap>).next(convertToParamMap({ token }));

      // Wait for async operations to complete
      await fixture.whenStable();

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        summary: expect.any(String),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        detail: expect.any(String),
      });
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });

    it('should set error message if email verification fails', async () => {
      const token = 'test-token';
      const errorMessage = 'Verification failed';
      (mockAuthService.verifyEmail as jest.Mock).mockRejectedValue(new Error(errorMessage));
      (mockActivatedRoute.paramMap as BehaviorSubject<ParamMap>).next(convertToParamMap({ token }));

      // Wait for async operations to complete
      await fixture.whenStable();

      expect(component.errorMessage()).toContain(errorMessage);
    });
  });
});
