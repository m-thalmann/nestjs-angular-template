import { Role, type PermissionDefinition } from '@backend/permissions';
import { User } from './user.entity';

const canManage = (user: User, entity: User): boolean => user.role === Role.Admin || user.id === entity.id;

export const USER_PERMISSIONS = {
  CreateUser: ['Create user'],
  ReadAllUsers: ['Read all users'],
  ReadUser: ['Read user', canManage],
  UpdateUser: ['Update user'],
  UpdateAuthUser: ['Update own user'],
  DeleteUser: ['Delete user', canManage],
} as const satisfies Record<string, PermissionDefinition<User>>;
