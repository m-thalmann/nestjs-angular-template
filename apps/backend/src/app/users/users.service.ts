import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { User, UserWithTimestamps } from './dto/user.dto';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findAll(): Promise<Array<UserEntity>> {
    return await this.usersRepository.find();
  }

  async findOne(uuid: string): Promise<UserEntity | null> {
    return await this.usersRepository.findOneBy({ uuid });
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return await this.usersRepository.findOneBy({ email });
  }

  async create(data: CreateUserDto): Promise<UserEntity> {
    const user = this.usersRepository.create(data);
    return await this.usersRepository.save(user);
  }

  async patch(user: UserEntity, data: PatchUserDto): Promise<UserEntity> {
    const patchedUser = this.usersRepository.merge(user, data);

    if (data.email !== undefined && user.email !== data.email) {
      patchedUser.emailVerifiedAt = null;
    }

    return await this.usersRepository.save(patchedUser);
  }

  async remove(uuid: string): Promise<void> {
    await this.usersRepository.delete({ uuid });
  }

  buildDto(user: UserEntity, withTimestamps?: false): User;
  buildDto(user: UserEntity, withTimestamps: true): UserWithTimestamps;
  buildDto(user: UserEntity, withTimestamps: boolean): User | UserWithTimestamps;
  buildDto(user: UserEntity, withTimestamps: boolean = false): User | UserWithTimestamps {
    const dto: User = {
      uuid: user.uuid,
      name: user.name,
      email: user.email,
    };

    if (withTimestamps) {
      const userWithTimestamps: UserWithTimestamps = {
        ...dto,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return userWithTimestamps;
    }

    return dto;
  }

  buildDtoArray(users: Array<UserEntity>, withTimestamps?: false): Array<User>;
  buildDtoArray(users: Array<UserEntity>, withTimestamps: true): Array<UserWithTimestamps>;
  buildDtoArray(users: Array<UserEntity>, withTimestamps: boolean): Array<User> | Array<UserWithTimestamps>;
  buildDtoArray(users: Array<UserEntity>, withTimestamps: boolean = false): Array<User> | Array<UserWithTimestamps> {
    return users.map((user) => this.buildDto(user, withTimestamps));
  }
}
