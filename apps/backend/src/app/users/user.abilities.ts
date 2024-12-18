import { AuthAbilityRuleFactory } from '../auth/abilities/auth-ability';
import { User } from './user.entity';

export const userAbilities: AuthAbilityRuleFactory = (user, { can }) => {
  if (user === undefined) {
    return;
  }

  if (user.isAdmin) {
    can('manage', User);
  }

  can(['read', 'update', 'delete'], User, { id: user.id });
};
