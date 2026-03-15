import { createMockExecutionContext } from '@backend/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { createMockUser } from '../../app/user/testing';
import { HAS_PERMISSION_DECORATOR_KEY, PermissionFailMode } from './has-permission.decorator';
import { HasPermissionsGuard } from './has-permissions.guard';
import { MissingPermissionException } from './missing-permission.exception';
import { hasPermission, Permission } from './permissions';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('./permissions', () => ({
  ...jest.requireActual('./permissions'),
  hasPermission: jest.fn(),
}));

describe('HasPermissionsGuard', () => {
  let guard: HasPermissionsGuard;

  let mockReflector: Partial<Reflector>;

  beforeEach(async () => {
    mockReflector = {
      get: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        HasPermissionsGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = await module.resolve<HasPermissionsGuard>(HasPermissionsGuard);
  });

  describe('canActivate', () => {
    it('should throw if user is not authenticated', () => {
      const mockContext = createMockExecutionContext();

      (mockReflector.get as jest.Mock).mockImplementation((token) => {
        if (token === HAS_PERMISSION_DECORATOR_KEY) {
          return Permission.UpdateAuthUser;
        }

        return undefined;
      });

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });

    it('should return true if no permission is required', () => {
      const mockContext = createMockExecutionContext({
        requestUser: createMockUser(),
      });

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should throw if user does not have required permission', () => {
      const mockPermission = Permission.CreateUser;
      const mockUser = createMockUser();

      const mockContext = createMockExecutionContext({
        requestUser: mockUser,
      });

      (mockReflector.get as jest.Mock).mockImplementation((token) => {
        if (token === HAS_PERMISSION_DECORATOR_KEY) {
          return mockPermission;
        }

        return undefined;
      });

      (hasPermission as jest.Mock).mockReturnValue(false);

      expect(() => guard.canActivate(mockContext)).toThrow(
        new MissingPermissionException(mockPermission, PermissionFailMode.Forbidden),
      );
      expect(hasPermission).toHaveBeenCalledWith(mockUser, mockPermission);
    });

    it('should throw with correct fail mode if user does not have required permission', () => {
      const mockPermission = Permission.CreateUser;
      const mockUser = createMockUser();
      const mockFailMode = PermissionFailMode.NotFound;

      const mockContext = createMockExecutionContext({
        requestUser: mockUser,
      });

      (mockReflector.get as jest.Mock).mockImplementation((token) => {
        if (token === HAS_PERMISSION_DECORATOR_KEY) {
          return mockPermission;
        }
        return mockFailMode;
      });

      (hasPermission as jest.Mock).mockReturnValue(false);

      expect(() => guard.canActivate(mockContext)).toThrow(
        new MissingPermissionException(mockPermission, mockFailMode),
      );
      expect(hasPermission).toHaveBeenCalledWith(mockUser, mockPermission);
    });

    it('should return true and set required permission and fail mode on request if user has permission', () => {
      const mockPermission = Permission.CreateUser;
      const mockUser = createMockUser();
      const mockFailMode = PermissionFailMode.NotFound;

      const mockContext = createMockExecutionContext({
        requestUser: mockUser,
      });

      (mockReflector.get as jest.Mock).mockImplementation((token) => {
        if (token === HAS_PERMISSION_DECORATOR_KEY) {
          return mockPermission;
        }
        return mockFailMode;
      });

      (hasPermission as jest.Mock).mockReturnValue(true);

      expect(guard.canActivate(mockContext)).toBe(true);

      const request = mockContext.switchToHttp().getRequest<Record<string, unknown>>();

      expect(request[HasPermissionsGuard.REQUEST_PERMISSION_KEY]).toBe(mockPermission);
      expect(request[HasPermissionsGuard.REQUEST_PERMISSION_FAIL_MODE_KEY]).toBe(mockFailMode);
    });
  });
});
