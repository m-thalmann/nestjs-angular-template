import { appConfigDefinition } from '@backend/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTokenService } from './tokens/auth-token.service';

describe('AuthController', () => {
  let controller: AuthController;

  let mockAuthService: Partial<AuthService>;
  let mockAuthTokenService: Partial<AuthTokenService>;

  beforeEach(async () => {
    mockAuthService = {};

    mockAuthTokenService = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthTokenService, useValue: mockAuthTokenService },
        {
          provide: appConfigDefinition.KEY,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
