import { PureAbility } from '@casl/ability';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '../../users/user.entity';
import { AuthAbility, AuthAbilityRuleFactory } from './auth-ability';

describe('AuthAbility', () => {
  let authAbility: AuthAbility;

  let mockAbility: Partial<PureAbility>;

  beforeEach(() => {
    mockAbility = {
      can: jest.fn(),
    };

    // @ts-expect-error type mismatch
    authAbility = new AuthAbility(mockAbility);
  });

  it('should be defined', () => {
    expect(authAbility).toBeDefined();
  });

  describe('can', () => {
    it.each([true, false])('should call ability.can (expected: %p)', (expectedResult: boolean) => {
      (mockAbility.can as jest.Mock).mockReturnValue(expectedResult);

      const result = authAbility.can('read', 'Post');

      expect(result).toBe(expectedResult);
      expect(mockAbility.can).toHaveBeenCalledWith('read', 'Post', undefined);
    });

    it.each([true, false])('should call ability.can with one field (expected: %p)', (expectedResult: boolean) => {
      (mockAbility.can as jest.Mock).mockReturnValue(expectedResult);

      const result = authAbility.can('read', 'Post', 'title');

      expect(result).toBe(expectedResult);
      expect(mockAbility.can).toHaveBeenCalledWith('read', 'Post', 'title');
    });

    it.each([
      { results: { title: false, content: true, author: true }, expectedResult: false },
      { results: { title: true, content: false, author: true }, expectedResult: false },
      { results: { title: true, content: true, author: false }, expectedResult: false },
      { results: { title: true, content: true, author: true }, expectedResult: true },
    ])(
      'should call ability.can with multiple fields (title: $results.title, content: $results.content, author: $results.author, expected result: $expectedResult)',
      ({ results, expectedResult }) => {
        (mockAbility.can as jest.Mock).mockImplementation(
          (action, subject, field) => results[field as keyof typeof results],
        );

        const fields = ['title', 'content', 'author'];
        const result = authAbility.can('read', 'Post', fields);

        expect(result).toBe(expectedResult);

        for (let i = 0; i < fields.length; i++) {
          const field = fields[i] as keyof typeof results;
          expect(mockAbility.can).toHaveBeenNthCalledWith(i + 1, 'read', 'Post', field);

          if (!results[field]) {
            break;
          }
        }
      },
    );
  });

  describe('cannot', () => {
    it.each([true, false])('should call can and return the opposite (result: %p)', (expectedResult: boolean) => {
      authAbility.can = jest.fn().mockReturnValue(!expectedResult);

      const result = authAbility.cannot('read', 'Post', ['title', 'author']);

      expect(result).toBe(expectedResult);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authAbility.can).toHaveBeenCalledWith('read', 'Post', ['title', 'author']);
    });
  });

  describe('authorize', () => {
    it('should call cannot and throw ForbiddenException', () => {
      authAbility.cannot = jest.fn().mockReturnValue(true);

      expect(() => authAbility.authorize('read', 'Post', ['title', 'author'])).toThrow(ForbiddenException);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authAbility.cannot).toHaveBeenCalledWith('read', 'Post', ['title', 'author']);
    });

    it('should not throw ForbiddenException', () => {
      authAbility.cannot = jest.fn().mockReturnValue(false);

      expect(() => authAbility.authorize('read', 'Post', ['title', 'author'])).not.toThrow();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authAbility.cannot).toHaveBeenCalledWith('read', 'Post', ['title', 'author']);
    });
  });

  describe('authorizeAnonymous', () => {
    it('should call cannot and throw NotFoundException', () => {
      authAbility.cannot = jest.fn().mockReturnValue(true);

      expect(() => authAbility.authorizeAnonymous('read', 'Post', ['title', 'author'])).toThrow(NotFoundException);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authAbility.cannot).toHaveBeenCalledWith('read', 'Post', ['title', 'author']);
    });

    it('should not throw NotFoundException', () => {
      authAbility.cannot = jest.fn().mockReturnValue(false);

      expect(() => authAbility.authorizeAnonymous('read', 'Post', ['title', 'author'])).not.toThrow();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authAbility.cannot).toHaveBeenCalledWith('read', 'Post', ['title', 'author']);
    });
  });

  describe('createForUser / registerAbilityFactory', () => {
    it('should create an instance of AuthAbility', () => {
      const user = new User();

      const result = AuthAbility.createForUser(user);

      expect(result).toBeInstanceOf(AuthAbility);
    });

    it('should use the rule factories to define abilities', () => {
      const user = new User();

      const ruleFactory1 = jest.fn();
      const ruleFactory2 = jest.fn();

      AuthAbility.registerAbilityFactory(ruleFactory1);
      AuthAbility.registerAbilityFactory(ruleFactory2);

      const ability = AuthAbility.createForUser(user);

      expect((ability as unknown as { ability: PureAbility }).ability).toBeInstanceOf(PureAbility);

      expect(ruleFactory1).toHaveBeenCalledWith(user, expect.any(Object));
      expect(ruleFactory2).toHaveBeenCalledWith(user, expect.any(Object));

      const [factoryUserArg, factoryBuilderArg] = ruleFactory1.mock.calls[0] as Parameters<AuthAbilityRuleFactory>;

      expect(factoryUserArg).toBe(user);
      expect(factoryBuilderArg).toMatchObject({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        can: expect.any(Function),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        cannot: expect.any(Function),
      });
    });
  });
});
