import { Role } from '../../common';

export interface PatchUser {
  name?: string;
  email?: string;
  password?: string;
}

export interface PatchUserManaged extends PatchUser {
  role?: Role;
}
