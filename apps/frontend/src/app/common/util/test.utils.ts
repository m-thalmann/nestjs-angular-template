import { DetailedUserDto } from '@app/shared-types';

export function createMockUser(options: { isAdmin?: boolean; isEmailVerified?: boolean } = {}): DetailedUserDto {
  const { isAdmin = false, isEmailVerified = true } = options;

  return {
    uuid: '1b888700-2a6c-42cd-b8ea-4d2485735d0a',
    name: 'John Doe',
    email: 'john@example.com',
    isAdmin,
    isEmailVerified,
    createdAt: 1733255679,
    updatedAt: 1733255679,
  };
}
