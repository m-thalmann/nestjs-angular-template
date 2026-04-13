import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { DEFAULT_ROUTE } from '@frontend/constants';
import { promiseTimesOut } from '@frontend/testing';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  let mockAuthService: Partial<AuthService>;
  let mockRouter: Partial<Router>;

  const executeGuard: () => Observable<boolean | UrlTree> = () =>
    TestBed.runInInjectionContext(
      () => guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Observable<boolean | UrlTree>,
    );

  beforeEach(() => {
    mockAuthService = {
      authUser$: new BehaviorSubject(null),
      isInitialized$: new BehaviorSubject(false),
    };

    mockRouter = {
      createUrlTree: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: Router,
          useValue: mockRouter,
        },
      ],
    });
  });

  it('should allow access if user is not authenticated', async () => {
    (mockAuthService.authUser$ as BehaviorSubject<unknown>).next(null);
    (mockAuthService.isInitialized$ as BehaviorSubject<boolean>).next(true);

    const result = await firstValueFrom(executeGuard());

    expect(result).toBe(true);
  });

  it('should redirect to default route if user is authenticated', async () => {
    (mockAuthService.authUser$ as BehaviorSubject<unknown>).next({} as never);
    (mockAuthService.isInitialized$ as BehaviorSubject<boolean>).next(true);
    (mockRouter.createUrlTree as jest.Mock).mockReturnValue({} as UrlTree);

    const result = await firstValueFrom(executeGuard());

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith([DEFAULT_ROUTE]);
    expect(result).toEqual({});
  });

  it('should not return if user is not initialized', async () => {
    (mockAuthService.authUser$ as BehaviorSubject<null>).next(null);
    (mockAuthService.isInitialized$ as BehaviorSubject<boolean>).next(false);

    const resultPromise = firstValueFrom(executeGuard());

    await expect(promiseTimesOut(resultPromise)).resolves.toBe(true);

    (mockAuthService.isInitialized$ as BehaviorSubject<boolean>).next(true);

    await expect(resultPromise).resolves.toBe(true);
  });
});
