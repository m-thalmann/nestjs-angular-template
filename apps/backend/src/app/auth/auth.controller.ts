import { Controller, Get } from '@nestjs/common';
import { AuthTokenService } from './tokens/auth-token.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authTokenService: AuthTokenService) {}

  @Get()
  getData(): unknown {
    console.log(this.authTokenService);

    return { message: 'Hello API' };
  }
}
