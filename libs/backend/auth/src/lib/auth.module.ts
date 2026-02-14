import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthToken } from './tokens/auth-token.entity';
import { AuthTokenService } from './tokens/auth-token.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuthToken])],
  controllers: [AuthController],
  providers: [AuthTokenService],
  exports: [],
})
export class AuthModule {}
