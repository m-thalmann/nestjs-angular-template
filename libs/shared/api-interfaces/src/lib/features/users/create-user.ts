import { Role } from '../../common';

export interface CreateUser {
  name: string;
  email: string;
  password: string;
  role: Role;
}
