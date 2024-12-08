import { PaginationMeta } from '@app/shared-types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { buildPaginationMeta, PaginationParams } from '../common/util';
import { CreateUserDto } from './dto/create-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(options: {
    pagination: PaginationParams;
  }): Promise<{ users: Array<User>; paginationMeta: PaginationMeta }> {
    const findOptions: FindManyOptions<User> = {
      skip: options.pagination.offset,
      take: options.pagination.perPage,
    };

    const users = await this.usersRepository.find(findOptions);

    const total = await this.usersRepository.count();
    const paginationMeta = buildPaginationMeta(options.pagination, total);

    return { users, paginationMeta };
  }

  async findOne(uuid: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ uuid });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ email });
  }

  async create(data: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(data);
    return await this.usersRepository.save(user);
  }

  async patch(user: User, data: PatchUserDto): Promise<User> {
    const patchedUser = this.usersRepository.merge(user, data);

    if (data.email !== undefined && user.email !== data.email) {
      patchedUser.emailVerifiedAt = null;
    }

    return await this.usersRepository.save(patchedUser);
  }

  async remove(uuid: string): Promise<void> {
    await this.usersRepository.delete({ uuid });
  }
}
