import { Role } from '../../common';

export interface User {
  uuid: string;
  name: string;
  email: string;
}

export interface DetailedUser extends User {
  role: Role;
  isEmailVerified: boolean;
  createdAt: number;
  updatedAt: number;
}
