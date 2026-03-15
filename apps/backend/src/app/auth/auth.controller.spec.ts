import { appConfigDefinition } from '@backend/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DetailedUserDto } from '../user/dto/user.dto';
import { createMockUser } from '../user/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { createMockAuthToken } from './testing';
import { AuthTokenService } from './tokens/auth-token.service';

describe('AuthController', () => {
  let controller: AuthController;

  let mockAuthService: Partial<AuthService>;
  let mockAuthTokenService: Partial<AuthTokenService>;

  beforeEach(async () => {
    mockAuthService = {
      loginUser: jest.fn(),
      signUpUser: jest.fn(),
    };

    mockAuthTokenService = {
      createAndBuildTokenPair: jest.fn(),
      refreshTokenPair: jest.fn(),
      logoutToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthTokenService, useValue: mockAuthTokenService },
        { provide: appConfigDefinition.KEY, useValue: {} },
      ],
    }).compile();

    controller = await module.resolve<AuthController>(AuthController);
  });

  describe('getAuthenticatedUser', () => {
    it('should return the authenticated user', async () => {
      const mockUser = createMockUser();

      const result = await controller.getAuthenticatedUser(mockUser);

      expect(result).toEqual({
        data: DetailedUserDto.fromEntity(mockUser),
      });
    });
  });

  describe('login', () => {
    it('should perform login and return tokens', async () => {
      const loginDto = { email: 'john@example.com', password: 'password' };
      const mockUser = createMockUser();

      mockAuthService.loginUser = jest.fn().mockResolvedValue(mockUser);

      const mockTokens = {
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      };
      mockAuthTokenService.createAndBuildTokenPair = jest.fn().mockResolvedValue(mockTokens);

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        data: {
          user: DetailedUserDto.fromEntity(mockUser),
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
        },
      });
      expect(mockAuthService.loginUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockAuthTokenService.createAndBuildTokenPair).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('signUp', () => {
    it('should create a new user account and return tokens', async () => {
      const signUpDto = { email: 'jane@example.com', password: 'password', name: 'Jane Doe' };
      const mockUser = createMockUser();

      mockAuthService.signUpUser = jest.fn().mockResolvedValue(mockUser);

      const mockTokens = {
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      };
      mockAuthTokenService.createAndBuildTokenPair = jest.fn().mockResolvedValue(mockTokens);

      const result = await controller.signUp(signUpDto);

      expect(result).toEqual({
        data: {
          user: DetailedUserDto.fromEntity(mockUser),
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
        },
      });
      expect(mockAuthService.signUpUser).toHaveBeenCalledWith(signUpDto);
      expect(mockAuthTokenService.createAndBuildTokenPair).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('refreshToken', () => {
    it('should refresh the access token', async () => {
      const mockUser = createMockUser();
      const mockAuthToken = createMockAuthToken();

      const mockTokens = {
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      };
      mockAuthTokenService.refreshTokenPair = jest.fn().mockResolvedValue(mockTokens);

      const result = await controller.refreshToken(mockUser, mockAuthToken);

      expect(result).toEqual({
        data: {
          user: DetailedUserDto.fromEntity(mockUser),
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
        },
      });
      expect(mockAuthTokenService.refreshTokenPair).toHaveBeenCalledWith(mockAuthToken);
    });
  });

  describe('logout', () => {
    it('should log out the user', async () => {
      const mockAuthToken = createMockAuthToken();

      await controller.logout(mockAuthToken);

      expect(mockAuthTokenService.logoutToken).toHaveBeenCalledWith(mockAuthToken);
    });
  });
});
