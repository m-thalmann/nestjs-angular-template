import { User } from '@backend/user';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { createMockUser } from '../../features/user/testing';
import { PermissionFailMode } from './has-permission.decorator';
import { HasPermissionsGuard } from './has-permissions.guard';
import { HasPermissionsPipe } from './has-permissions.pipe';
import { MissingPermissionException } from './missing-permission.exception';
import { hasPermission, Permission } from './permissions';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('./permissions', () => ({
  ...jest.requireActual('./permissions'),
  hasPermission: jest.fn(),
}));

interface HasPermissionsPipeRequest {
  user?: User;
  [HasPermissionsGuard.REQUEST_PERMISSION_KEY]?: Permission;
  [HasPermissionsGuard.REQUEST_PERMISSION_FAIL_MODE_KEY]?: PermissionFailMode;
}

describe('HasPermissionsPipe', () => {
  let pipe: HasPermissionsPipe<unknown>;

  let mockRequest: HasPermissionsPipeRequest;

  beforeEach(async () => {
    mockRequest = {};

    const module = await Test.createTestingModule({
      providers: [
        HasPermissionsPipe,
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    pipe = module.get<HasPermissionsPipe<unknown>>(HasPermissionsPipe);
  });

  describe('transform', () => {
    it('should throw if no permission metadata is found on request', () => {
      expect(() => pipe.transform({})).toThrow(
        new InternalServerErrorException('No permission metadata found on request'),
      );
    });

    it('should throw if permission metadata is a simple permission', () => {
      mockRequest[HasPermissionsGuard.REQUEST_PERMISSION_KEY] = Permission.CreateUser;

      expect(() => pipe.transform({})).toThrow(
        new InternalServerErrorException('HasPermissionsPipe can only be used with conditional permissions'),
      );
    });

    it('should throw if user is not authenticated', () => {
      mockRequest[HasPermissionsGuard.REQUEST_PERMISSION_KEY] = Permission.DeleteUser;

      expect(() => pipe.transform({})).toThrow(UnauthorizedException);
    });

    it('should throw if user does not have required permission', () => {
      const mockUser = createMockUser();
      const deleteUser = createMockUser({ name: 'Other user' });

      (hasPermission as jest.Mock).mockReturnValue(false);

      mockRequest.user = mockUser;
      mockRequest[HasPermissionsGuard.REQUEST_PERMISSION_KEY] = Permission.DeleteUser;

      expect(() => pipe.transform(deleteUser)).toThrow(
        new MissingPermissionException(Permission.DeleteUser, PermissionFailMode.Forbidden),
      );

      expect(hasPermission).toHaveBeenCalledWith(mockUser, Permission.DeleteUser, deleteUser);
    });

    it('should use permission fail mode from request if user does not have required permission', () => {
      const mockUser = createMockUser();
      const deleteUser = createMockUser({ name: 'Other user' });

      (hasPermission as jest.Mock).mockReturnValue(false);

      mockRequest.user = mockUser;
      mockRequest[HasPermissionsGuard.REQUEST_PERMISSION_KEY] = Permission.DeleteUser;
      mockRequest[HasPermissionsGuard.REQUEST_PERMISSION_FAIL_MODE_KEY] = PermissionFailMode.NotFound;

      expect(() => pipe.transform(deleteUser)).toThrow(
        new MissingPermissionException(Permission.DeleteUser, PermissionFailMode.NotFound),
      );

      expect(hasPermission).toHaveBeenCalledWith(mockUser, Permission.DeleteUser, deleteUser);
    });

    it('should return entity if user has required permission', () => {
      const mockUser = createMockUser();
      const deleteUser = createMockUser({ name: 'Other user' });

      (hasPermission as jest.Mock).mockReturnValue(true);

      mockRequest.user = mockUser;
      mockRequest[HasPermissionsGuard.REQUEST_PERMISSION_KEY] = Permission.DeleteUser;

      expect(pipe.transform(deleteUser)).toBe(deleteUser);

      expect(hasPermission).toHaveBeenCalledWith(mockUser, Permission.DeleteUser, deleteUser);
    });
  });
});
