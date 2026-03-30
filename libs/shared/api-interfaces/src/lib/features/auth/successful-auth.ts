import { DetailedUser } from '../users';

export interface SuccessfulAuth {
  user: DetailedUser;
  accessToken: string;
  refreshToken: string;
}
