import { CommonModule } from '@backend/common';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

@Module({
  imports: [CommonModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
