import { AbilityAction, AuthAbilityRuleFactory } from '@backend/auth';
import { User } from './user.entity';

export const userAbilities: AuthAbilityRuleFactory = (user, { can }) => {
  if (user === undefined) {
    return;
  }

  if (user.isAdmin) {
    can(AbilityAction.Manage, User);
    return;
  }

  can([AbilityAction.Read, AbilityAction.Delete], User, { id: user.id });
  can(AbilityAction.Update, User, ['name', 'email', 'password'], { id: user.id });
};
