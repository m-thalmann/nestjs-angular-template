import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User, UsersService } from '../users';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  // TODO: delete tokens when user is updated (e.g. only if password or email is changed)

  async loginUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findOneByEmail(email);

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
    return await this.usersService.create({ ...signUpDto, isAdmin: false });
  }
}
