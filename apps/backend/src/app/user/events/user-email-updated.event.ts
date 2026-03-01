import { User } from '../user.entity';

export class UserEmailUpdatedEvent {
  static readonly ID: string = 'user.email-updated';

  constructor(public readonly user: User) {}
}
