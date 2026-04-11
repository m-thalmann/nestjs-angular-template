import { Role } from '../../common';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}
