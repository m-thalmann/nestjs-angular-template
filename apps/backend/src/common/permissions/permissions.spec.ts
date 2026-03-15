import { createMockUser } from '../../app/user/testing';
import { hasPermission, Permission } from './permissions';

describe('Permissions', () => {
  describe('hasPermission', () => {
    it('should return true if user has permission', () => {
      const mockUser = createMockUser();
      const mockPermission = Permission.UpdateAuthUser;

      expect(hasPermission(mockUser, mockPermission)).toBe(true);
    });

    it('should return false if user does not have permission', () => {
      const mockUser = createMockUser();
      const mockPermission = Permission.CreateUser;

      expect(hasPermission(mockUser, mockPermission)).toBe(false);
    });

    it('should return true for conditional permission if user has permission without passing model', () => {
      const mockUser = createMockUser();
      const mockPermission = Permission.DeleteUser;

      expect(hasPermission(mockUser, mockPermission)).toBe(true);
    });

    it('should return true for conditional permission if user has permission and condition is met', () => {
      const mockUser = createMockUser();
      const mockPermission = Permission.DeleteUser;

      expect(hasPermission(mockUser, mockPermission, mockUser)).toBe(true);
    });

    it('should return false for conditional permission if user has permission but condition is not met', () => {
      const mockUser = createMockUser();
      const anotherUser = createMockUser();
      const mockPermission = Permission.DeleteUser;

      expect(hasPermission(mockUser, mockPermission, anotherUser)).toBe(false);
    });
  });
});
