import { Public } from '@backend/decorators';
import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller()
@Public()
@ApiExcludeController()
export class AppController {
  @Get()
  getMessage(): { message: string } {
    return { message: '@nestjs-angular-template REST API' };
  }
}
