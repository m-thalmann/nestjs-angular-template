/* eslint-disable max-classes-per-file */
import { User } from '@backend/feature-users';

export type AbilityResponse = Promise<boolean> | boolean;

export abstract class BaseAbility<T> {
  // abstract edit(user: User, entity: T): boolean;

  // TODO: CONTINUE
  [key: string]: (user: User | undefined, entity: T) => AbilityResponse;
}

class Test extends BaseAbility<string> {
  readonly edit = (user: User | undefined): boolean => {
    console.log(user);

    return true;
  };

  test(user: User | undefined, entity: string): boolean {
    return true;
  }

  private testung(): void {
    console.log(1);
  }
}

// TODO: test if when calling this up there the this bind is still correct!!
