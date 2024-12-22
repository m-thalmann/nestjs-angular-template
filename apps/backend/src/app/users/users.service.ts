import { PaginationMeta } from '@app/shared-types';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { buildPaginationMeta, PaginationParams } from '../common/util/pagination.utils';
import { CreateUserDto } from './dto/create-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { UserCreatedEvent } from './events/user-created.event';
import { UserEmailUpdatedEvent } from './events/user-email-updated.event';
import { User } from './user.entity';

// TODO: add tests for this class

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
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
    const createdUser = await this.usersRepository.save(user);

    this.eventEmitter.emit(UserCreatedEvent.ID, new UserCreatedEvent(createdUser));

    return createdUser;
  }

  async patch(user: User, data: PatchUserDto): Promise<User> {
    const patchedUser = this.usersRepository.merge(user, data);
    let emailUpdated = false;

    if (data.email !== undefined && user.email !== data.email) {
      patchedUser.emailVerifiedAt = null;
      emailUpdated = true;
    }

    const updatedUser = await this.usersRepository.save(patchedUser);

    if (emailUpdated) {
      this.eventEmitter.emit(UserCreatedEvent.ID, new UserEmailUpdatedEvent(updatedUser));
    }

    return updatedUser;
  }

  async markEmailAsVerified(user: User): Promise<User> {
    const updatedUser = this.usersRepository.merge(user, {
      emailVerifiedAt: new Date(),
    });

    return await this.usersRepository.save(updatedUser);
  }

  async remove(uuid: string): Promise<void> {
    await this.usersRepository.delete({ uuid });
  }
}
