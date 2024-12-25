import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthTokenService } from '../auth/tokens/auth-token.service';
import { buildPaginationMeta, PaginationParams } from '../common/util/pagination.utils';
import { UniqueValidator } from '../common/validation/unique.validator';
import { UserCreatedEvent } from './events/user-created.event';
import { UserEmailUpdatedEvent } from './events/user-email-updated.event';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  let mockUsersRepository: Partial<Repository<User>>;
  let mockAuthTokenService: Partial<AuthTokenService>;
  let mockUniqueValidator: Partial<UniqueValidator>;
  let mockEventEmitter: Partial<EventEmitter2>;

  beforeEach(async () => {
    mockUsersRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn(),
    };

    mockAuthTokenService = {
      deleteAllForUser: jest.fn(),
    };

    mockUniqueValidator = {
      validateProperty: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: AuthTokenService,
          useValue: mockAuthTokenService,
        },
        {
          provide: UniqueValidator,
          useValue: mockUniqueValidator,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const paginationParams: PaginationParams = { offset: 10, perPage: 10, page: 1 };

      const expectedUsers = [new User(), new User()];
      const expectedPaginationMeta = buildPaginationMeta(paginationParams, expectedUsers.length);

      (mockUsersRepository.find as jest.Mock).mockResolvedValue(expectedUsers);
      (mockUsersRepository.count as jest.Mock).mockResolvedValue(expectedUsers.length);

      const result = await service.findAll({ pagination: paginationParams });

      expect(result).toEqual({ users: expectedUsers, paginationMeta: expectedPaginationMeta });

      expect(mockUsersRepository.find).toHaveBeenCalledWith({
        skip: paginationParams.offset,
        take: paginationParams.perPage,
      });
      expect(mockUsersRepository.count).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a user by UUID', async () => {
      const expectedUser = new User();

      (mockUsersRepository.findOneBy as jest.Mock).mockResolvedValue(expectedUser);

      const result = await service.findOne(expectedUser.uuid);

      expect(result).toEqual(expectedUser);

      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ uuid: expectedUser.uuid });
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user by email', async () => {
      const expectedUser = new User();
      expectedUser.email = 'user@example.com';

      (mockUsersRepository.findOneBy as jest.Mock).mockResolvedValue(expectedUser);

      const result = await service.findOneByEmail(expectedUser.email);

      expect(result).toEqual(expectedUser);

      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ email: expectedUser.email });
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto = { name: 'Jane Doe', email: 'jane.doe@example.com', password: 'password', isAdmin: false };

      const expectedUser = new User();
      expectedUser.name = createUserDto.name;
      expectedUser.email = createUserDto.email;
      expectedUser.password = createUserDto.password;
      expectedUser.isAdmin = createUserDto.isAdmin;

      (mockUsersRepository.create as jest.Mock).mockReturnValue(expectedUser);
      (mockUsersRepository.save as jest.Mock).mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(expectedUser);

      expect(mockUsersRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUsersRepository.save).toHaveBeenCalledWith(expectedUser);
      expect(expectedUser.isEmailVerified()).toBe(false);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(UserCreatedEvent.ID, expect.any(UserCreatedEvent));

      const [, sentEvent] = (mockEventEmitter.emit as jest.Mock).mock.calls[0] as [string, UserCreatedEvent];

      expect(sentEvent.user).toBe(result);
    });
  });

  describe('patch', () => {
    it('should update a user', async () => {
      const user = new User();

      const patchUserDto = { name: 'new name' };

      const updatedUser = new User();
      updatedUser.name = patchUserDto.name;

      (mockUsersRepository.merge as jest.Mock).mockReturnValue(updatedUser);
      (mockUsersRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.patch(user, patchUserDto);

      expect(result).toEqual(updatedUser);

      expect(mockUsersRepository.merge).toHaveBeenCalledWith(user, patchUserDto);
      expect(mockUsersRepository.save).toHaveBeenCalledWith(updatedUser);

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
      expect(mockAuthTokenService.deleteAllForUser).not.toHaveBeenCalled();
    });

    it("should update a user's email, trigger email verification and log it out from everywhere", async () => {
      const user = new User();
      user.email = 'old@example.com';
      user.emailVerifiedAt = new Date();

      const patchUserDto = { email: 'new@example.com' };

      const updatedUser = new User();
      updatedUser.email = patchUserDto.email;

      (mockUsersRepository.merge as jest.Mock).mockReturnValue(updatedUser);
      (mockUsersRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.patch(user, patchUserDto);

      expect(result).toEqual(updatedUser);
      expect(result.emailVerifiedAt).toBeNull();

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(UserEmailUpdatedEvent.ID, expect.any(UserEmailUpdatedEvent));

      const [, sentEvent] = (mockEventEmitter.emit as jest.Mock).mock.calls[0] as [string, UserEmailUpdatedEvent];

      expect(sentEvent.user).toBe(result);

      expect(mockAuthTokenService.deleteAllForUser).toHaveBeenCalledWith(result);
    });

    it("should update a user's password, trigger email verification and log it out from everywhere", async () => {
      const user = new User();
      user.password = 'old-password';

      const patchUserDto = { password: 'new-password' };

      const updatedUser = new User();
      updatedUser.password = patchUserDto.password;

      (mockUsersRepository.merge as jest.Mock).mockReturnValue(updatedUser);
      (mockUsersRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.patch(user, patchUserDto);

      expect(result).toEqual(updatedUser);

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
      expect(mockAuthTokenService.deleteAllForUser).toHaveBeenCalledWith(result);
    });

    it('should validate the email uniqueness', async () => {
      const user = new User();

      const patchUserDto = { email: 'existing@mail.com' };

      (mockUniqueValidator.validateProperty as jest.Mock).mockRejectedValue(new Error('Email already exists'));

      await expect(service.patch(user, patchUserDto)).rejects.toThrow('Email already exists');

      expect(mockUniqueValidator.validateProperty).toHaveBeenCalledWith({
        entityClass: User,
        column: 'email',
        value: patchUserDto.email,
        entityDisplayName: 'User',
      });

      expect(mockUsersRepository.merge).not.toHaveBeenCalled();
      expect(mockUsersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('markEmailAsVerified', () => {
    it('should mark a user email as verified', async () => {
      const user = new User();

      const updatedUser = new User();
      updatedUser.emailVerifiedAt = new Date();

      (mockUsersRepository.merge as jest.Mock).mockReturnValue(updatedUser);
      (mockUsersRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.markEmailAsVerified(user);

      expect(result).toEqual(updatedUser);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expect(mockUsersRepository.merge).toHaveBeenCalledWith(user, { emailVerifiedAt: expect.any(Date) });
      expect(mockUsersRepository.save).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const user = new User();

      await service.remove(user.uuid);

      expect(mockUsersRepository.delete).toHaveBeenCalledWith({ uuid: user.uuid });
    });
  });
});
