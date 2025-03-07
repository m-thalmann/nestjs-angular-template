import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './auth/guards/auth.guard';

@Controller('/')
@ApiExcludeController()
export class AppController {
  @Get()
  @Public()
  getMessage(): { message: string } {
    return { message: '@nestjs-angular-template/source Rest API' };
  }
}
