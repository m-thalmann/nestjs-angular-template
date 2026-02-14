import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  // async loginUser(email: string, password: string): Promise<User> {
  //   const user = await this.userService.findOneByEmail(email);

  //   if (user === null) {
  //     throw new UnauthorizedException();
  //   }

  //   const isCorrectPassword = await argon2.verify(user.password, password);

  //   if (!isCorrectPassword) {
  //     throw new UnauthorizedException();
  //   }

  //   return user;
  // }

  // async signUpUser(signUpDto: SignUpDto): Promise<User> {
  //   return await this.userService.create({ ...signUpDto, isAdmin: false });
  // }
}
