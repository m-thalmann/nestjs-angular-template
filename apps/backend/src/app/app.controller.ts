import { Public } from '@backend/decorators';
import { Controller, Get } from '@nestjs/common';

@Controller()
@Public()
export class AppController {
  @Get()
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
