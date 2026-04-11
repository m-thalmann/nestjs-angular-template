import { Role } from '../../common';

export interface PatchUserRequest {
  name?: string;
  email?: string;
  password?: string;
}

export interface PatchUserManagedRequest extends PatchUserRequest {
  role?: Role;
}
