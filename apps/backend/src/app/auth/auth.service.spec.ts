import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';

describe('AuthService', () => {
  let service: AuthService;

  let mockUserService: Partial<UsersService>;

  beforeEach(async () => {
    mockUserService = {
      findOneByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw an UnauthorizedException if the user does not exist', async () => {
      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.loginUser('test@mail.org', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an UnauthorizedException if the password is incorrect', async () => {
      const password = await argon2.hash('password');
      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue({ password });

      await expect(service.loginUser('test@mail.org', 'wrongPassword')).rejects.toThrow(UnauthorizedException);
    });

    it('should return the user if it exists and the password is correct', async () => {
      const plainPassword = 'password';
      const password = await argon2.hash(plainPassword);
      const user = { password };

      (mockUserService.findOneByEmail as jest.Mock).mockResolvedValue(user);

      const result = await service.loginUser('test@mail.org', plainPassword);

      expect(result).toEqual(user);
    });
  });

  describe('signUpUser', () => {
    it('should create a new user', async () => {
      const signUpDto: SignUpDto = {
        name: 'New User',
        email: 'new@user.org',
        password: 'password',
      };

      const expectedUser = new User();

      (mockUserService.create as jest.Mock).mockResolvedValue(expectedUser);

      const result = await service.signUpUser(signUpDto);

      expect(result).toBe(expectedUser);

      expect(mockUserService.create).toHaveBeenCalledWith({ ...signUpDto, isAdmin: false });
    });
  });
});
