import { DetailedUser, User } from '@shared/api-interfaces';

export function createMockUser(overrides?: Partial<User>): User {
  return {
    uuid: '1b888700-2a6c-42cd-b8ea-4d2485735d0a',
    name: 'John Doe',
    email: 'john.doe@example.com',
    ...overrides,
  };
}

export function createMockDetailedUser(overrides?: Partial<DetailedUser>): DetailedUser {
  return {
    ...createMockUser(overrides),
    role: 'user',
    isEmailVerified: true,
    createdAt: 1733255679,
    updatedAt: 1733255679,
    ...overrides,
  };
}
