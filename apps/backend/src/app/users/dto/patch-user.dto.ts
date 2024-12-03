import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PatchUserDto {
  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @IsOptional()
  @IsNotEmpty()
  readonly password?: string;
}
