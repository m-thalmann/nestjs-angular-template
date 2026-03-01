export class RequestPasswordResetEvent {
  static readonly ID: string = 'auth.request-password-reset';

  constructor(
    public readonly email: string,
    public readonly token: string,
  ) {}
}
