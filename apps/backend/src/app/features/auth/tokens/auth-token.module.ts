import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthToken } from './auth-token.entity';
import { AuthTokenService } from './auth-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuthToken])],
  providers: [AuthTokenService],
  exports: [AuthTokenService],
})
export class AuthTokenModule {}
