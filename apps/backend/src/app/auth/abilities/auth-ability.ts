import { AbilityBuilder, createMongoAbility, ExtractSubjectType, PureAbility, Subject } from '@casl/ability';
import { ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { User } from '../../users';
import { AbilityAction } from './ability-action';

type AppAbility = PureAbility<[AbilityAction, Subject]>;

export type AuthAbilityRuleFactory = (
  user: User | undefined,
  builder: Pick<AbilityBuilder<AppAbility>, 'can' | 'cannot'>,
) => void;

export class AuthAbility {
  protected static readonly RULE_FACTORIES: Array<AuthAbilityRuleFactory> = [];

  constructor(private readonly ability: AppAbility) {}

  /**
   * Checks if the user has the given ability and throws a ForbiddenException if it doesn't
   */
  authorize(...args: Parameters<AppAbility['can']>): void {
    if (this.ability.cannot(...args)) {
      throw new ForbiddenException();
    }
  }

  /**
   * Checks if the user has the given ability and throws a NotFoundException if it doesn't
   */
  authorizeAnonymous(...args: Parameters<AppAbility['can']>): void {
    if (this.ability.cannot(...args)) {
      throw new NotFoundException();
    }
  }

  /**
   * Creates a new instance of the class for the given user.
   *
   * It uses the registered rule factories for the abilities.
   */
  static createForUser(user?: User): AuthAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    this.RULE_FACTORIES.forEach((factory) => {
      factory(user, { can, cannot });
    });

    const ability = build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subject>,
    });

    return new this(ability);
  }

  /**
   * Registers a factory to define abilities for the given model.
   *
   * **Note:** The model is only used for logging, but the factory should still only define abilities for that model
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  static registerAbilityFactory(abilityFactory: AuthAbilityRuleFactory, model: Function): void {
    this.RULE_FACTORIES.push(abilityFactory);
    Logger.log(`Registered abilities for model ${model.name}`, 'AuthAbility');
  }
}
