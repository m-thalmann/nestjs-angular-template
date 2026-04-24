export const RESET_PASSWORD_VALIDATE_TOKEN_QUERY_KEY = 'token';

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
