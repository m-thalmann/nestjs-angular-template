import { PaginationMetaDto, PaginationParams } from '@backend/models';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@shared/api-interfaces';
import { DataSource } from 'typeorm';
import { DetailedUserDto, UserDto } from './dto/user.dto';
import { createMockUser } from './testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  let mockUserService: Partial<UserService>;

  beforeEach(async () => {
    mockUserService = {
      create: jest.fn(),
      findAll: jest.fn(),
      patch: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: DataSource,
          useValue: {}, // Mock DataSource if needed
        },
      ],
    }).compile();

    controller = await module.resolve<UserController>(UserController);
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'user@example.com',
        password: 'password',
        role: Role.Admin,
      };

      const expectedUser = createMockUser();

      mockUserService.create = jest.fn().mockResolvedValue(expectedUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual({
        data: DetailedUserDto.fromEntity(expectedUser),
      });
      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedUsers = [createMockUser(), createMockUser()];
      const expectedPaginationMeta: PaginationMetaDto = {
        total: 2,
        pageSize: 10,
        currentPage: 1,
        lastPage: 1,
      };

      mockUserService.findAll = jest
        .fn()
        .mockResolvedValue({ users: expectedUsers, paginationMeta: expectedPaginationMeta } satisfies Awaited<
          ReturnType<UserService['findAll']>
        >);

      const mockPaginationParams: PaginationParams = { page: 2, pageSize: 30, offset: 11 };

      const result = await controller.findAll(mockPaginationParams);

      expect(result).toEqual({
        data: expectedUsers.map(UserDto.fromEntity),
        meta: expectedPaginationMeta,
      });
      expect(mockUserService.findAll).toHaveBeenCalledWith({ pagination: mockPaginationParams });
    });
  });

  describe('findOne', () => {
    it('should return a user by UUID', async () => {
      const expectedUser = createMockUser();

      const result = await controller.findOne(expectedUser);

      expect(result).toEqual({
        data: UserDto.fromEntity(expectedUser),
      });
    });
  });

  describe('updateAuthUser', () => {
    it('should update the authenticated user', async () => {
      const mockUser = createMockUser({ name: 'Old Name' });

      const expectedUser = createMockUser({ name: 'Updated Name' });
      const patchAuthUserDto = {
        name: 'Updated Name',
        email: 'me@example.com',
      };

      mockUserService.patch = jest.fn().mockResolvedValue(expectedUser);

      const result = await controller.updateAuthUser(mockUser, patchAuthUserDto);

      expect(result).toEqual({
        data: DetailedUserDto.fromEntity(expectedUser),
      });
      expect(mockUserService.patch).toHaveBeenCalledWith(mockUser, patchAuthUserDto);
    });
  });

  describe('update', () => {
    it('should update a user by UUID', async () => {
      const mockUser = createMockUser({ name: 'Old Name' });

      const expectedUser = createMockUser({ name: 'Updated Name' });
      const patchUserDto = {
        name: 'Updated Name',
        email: 'me@example.com',
        role: Role.Admin,
      };

      mockUserService.patch = jest.fn().mockResolvedValue(expectedUser);

      const result = await controller.update(mockUser, patchUserDto);

      expect(result).toEqual({
        data: DetailedUserDto.fromEntity(expectedUser),
      });
      expect(mockUserService.patch).toHaveBeenCalledWith(mockUser, patchUserDto);
    });
  });

  describe('remove', () => {
    it('should remove a user by UUID', async () => {
      const mockUser = createMockUser();

      mockUserService.remove = jest.fn().mockResolvedValue(undefined);

      await controller.remove(mockUser);

      expect(mockUserService.remove).toHaveBeenCalledWith(mockUser.uuid);
    });
  });
});
