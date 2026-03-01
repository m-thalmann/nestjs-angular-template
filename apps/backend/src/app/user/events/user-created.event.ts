import { User } from '../user.entity';

export class UserCreatedEvent {
  static readonly ID: string = 'user.created';

  constructor(public readonly user: User) {}
}
