import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { promiseTimesOut } from '@frontend/testing';
import { DetailedUser, Role } from '@shared/api-interfaces';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { authGuard, ROUTE_AUTH_ROLES } from './auth.guard';

function createActivatedRouteSnapshotMock(data: Record<string, unknown> = {}): ActivatedRouteSnapshot {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    data,
  } as ActivatedRouteSnapshot;
}

function createRouterStateSnapshotMock(url: string): RouterStateSnapshot {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    url,
  } as RouterStateSnapshot;
}

describe('authGuard', () => {
  let mockAuthService: Partial<AuthService>;
  let mockRouter: Partial<Router>;

  const executeGuard: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => Observable<boolean | UrlTree> = (
    ...guardParameters
  ) => TestBed.runInInjectionContext(() => authGuard(...guardParameters) as Observable<boolean | UrlTree>);

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

  it('should redirect to login if user is not authenticated', async () => {
    (mockAuthService.authUser$ as BehaviorSubject<unknown>).next(null);
    (mockAuthService.isInitialized$ as BehaviorSubject<boolean>).next(true);
    (mockRouter.createUrlTree as jest.Mock).mockReturnValue({} as UrlTree);

    const route = createActivatedRouteSnapshotMock();
    const state = createRouterStateSnapshotMock('/protected');

    const result = await firstValueFrom(executeGuard(route, state));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        'redirect-url': '/protected',
      },
    });
    expect(result).toEqual({});
  });

  it('should return true if user is authenticated', async () => {
    (mockAuthService.authUser$ as BehaviorSubject<DetailedUser>).next({ role: Role.User } as DetailedUser);
    (mockAuthService.isInitialized$ as BehaviorSubject<boolean>).next(true);

    const route = createActivatedRouteSnapshotMock();
    const state = createRouterStateSnapshotMock('/protected');

    const result = await firstValueFrom(executeGuard(route, state));

    expect(result).toBe(true);
  });

  it('should return true if user has any of the required roles', async () => {
    (mockAuthService.authUser$ as BehaviorSubject<DetailedUser>).next({ role: Role.Admin } as DetailedUser);
    (mockAuthService.isInitialized$ as BehaviorSubject<boolean>).next(true);

    const route = createActivatedRouteSnapshotMock({
      [ROUTE_AUTH_ROLES]: [Role.Admin, Role.User],
    });
    const state = createRouterStateSnapshotMock('/protected');

    const result = await firstValueFrom(executeGuard(route, state));

    expect(result).toBe(true);
  });

  it('should redirect to login if user does not have any of the required roles', async () => {
    (mockAuthService.authUser$ as BehaviorSubject<DetailedUser>).next({ role: Role.User } as DetailedUser);
    (mockAuthService.isInitialized$ as BehaviorSubject<boolean>).next(true);
    (mockRouter.createUrlTree as jest.Mock).mockReturnValue({} as UrlTree);

    const route = createActivatedRouteSnapshotMock({
      [ROUTE_AUTH_ROLES]: [Role.Admin],
    });
    const state = createRouterStateSnapshotMock('/protected');

    const result = await firstValueFrom(executeGuard(route, state));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        'redirect-url': '/protected',
      },
    });
    expect(result).toEqual({});
  });

  it('should not return if user is not initialized', async () => {
    (mockAuthService.authUser$ as BehaviorSubject<DetailedUser>).next({ role: Role.User } as DetailedUser);
    (mockAuthService.isInitialized$ as BehaviorSubject<boolean>).next(false);

    const route = createActivatedRouteSnapshotMock();
    const state = createRouterStateSnapshotMock('/protected');

    const resultPromise = firstValueFrom(executeGuard(route, state));

    await expect(promiseTimesOut(resultPromise)).resolves.toBe(true);

    (mockAuthService.isInitialized$ as BehaviorSubject<boolean>).next(true);

    await expect(resultPromise).resolves.toBe(true);
  });

  it('should throw an error if auth roles are not an array', async () => {
    const route = createActivatedRouteSnapshotMock({
      [ROUTE_AUTH_ROLES]: 'invalid-roles',
    });
    const state = createRouterStateSnapshotMock('/protected');

    expect(() => executeGuard(route, state)).toThrow(
      'Invalid auth roles configuration for route. Expected an array of Role values.',
    );
  });

  it('should throw an error if auth roles array contains invalid roles', async () => {
    const route = createActivatedRouteSnapshotMock({
      [ROUTE_AUTH_ROLES]: ['invalid-role'],
    });
    const state = createRouterStateSnapshotMock('/protected');

    expect(() => executeGuard(route, state)).toThrow(
      'Invalid auth roles configuration for route. Expected an array of Role values.',
    );
  });
});
