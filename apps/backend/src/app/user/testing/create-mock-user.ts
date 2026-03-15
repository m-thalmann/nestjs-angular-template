import { User } from '../user.entity';

let userIdCounter = 1;

export function createMockUser(options?: { emailVerified?: boolean; name?: string }): User {
  const { emailVerified = false, name = 'John Doe' } = options ?? {};

  const user = new User();
  user.id = userIdCounter++;
  user.uuid = '123e4567-e89b-12d3-a456-426614174000';
  user.name = name;
  user.email = 'me@example.com';
  user.password = 'hashed_password';
  user.role = 'user';
  user.createdAt = new Date();
  user.updatedAt = new Date();

  if (emailVerified) {
    user.emailVerifiedAt = new Date();
  }

  return user;
}
