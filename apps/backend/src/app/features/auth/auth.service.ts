import { User } from '@backend/user';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@shared/api-interfaces';
import * as argon2 from 'argon2';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async loginUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findOneByEmail(email);

    if (user === null) {
      throw new UnauthorizedException();
    }

    const isCorrectPassword = await argon2.verify(user.password, password);

    if (!isCorrectPassword) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async signUpUser(signUpDto: SignUpDto): Promise<User> {
    const user = new CreateUserDto();
    Object.assign(user, signUpDto);
    user.role = Role.User;

    return await this.userService.create(user);
  }
}
