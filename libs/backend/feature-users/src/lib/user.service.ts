import { PaginationMetaDto, PaginationParams } from '@backend/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    // private readonly authTokenService: AuthTokenService,
    // private readonly uniqueValidator: UniqueValidator,
    // private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(options: {
    pagination: PaginationParams;
  }): Promise<{ users: Array<User>; paginationMeta: PaginationMetaDto }> {
    const findOptions: FindManyOptions<User> = {
      skip: options.pagination.offset,
      take: options.pagination.perPage,
    };

    const users = await this.usersRepository.find(findOptions);

    const total = await this.usersRepository.count();
    const paginationMeta = PaginationMetaDto.build(options.pagination, total);

    return { users, paginationMeta };
  }

  async findOne(uuid: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ uuid });
  }

  // async findOneByEmail(email: string): Promise<User | null> {
  //   return await this.usersRepository.findOneBy({ email });
  // }

  // async create(data: CreateUserDto): Promise<User> {
  //   const user = this.usersRepository.create(data);
  //   const createdUser = await this.usersRepository.save(user);

  //   this.eventEmitter.emit(UserCreatedEvent.ID, new UserCreatedEvent(createdUser));

  //   return createdUser;
  // }

  // async patch(user: User, data: PatchUserDto): Promise<User> {
  //   const emailUpdated = data.email !== undefined && user.email !== data.email;
  //   const passwordUpdated = data.password !== undefined;

  //   if (data.email !== undefined && data.email !== user.email) {
  //     await this.uniqueValidator.validateProperty({
  //       entityClass: User,
  //       column: 'email',
  //       value: data.email,
  //       entityDisplayName: 'User',
  //     });
  //   }

  //   const patchedUser = this.usersRepository.merge(user, data);

  //   if (emailUpdated) {
  //     patchedUser.emailVerifiedAt = null;
  //   }

  //   const updatedUser = await this.usersRepository.save(patchedUser);

  //   if (emailUpdated) {
  //     this.eventEmitter.emit(UserEmailUpdatedEvent.ID, new UserEmailUpdatedEvent(updatedUser));
  //   }

  //   if (emailUpdated || passwordUpdated || data.isAdmin !== undefined) {
  //     await this.authTokenService.deleteAllForUser(updatedUser);
  //   }

  //   return updatedUser;
  // }

  // async markEmailAsVerified(user: User): Promise<User> {
  //   const updatedUser = this.usersRepository.merge(user, {
  //     emailVerifiedAt: new Date(),
  //   });

  //   return await this.usersRepository.save(updatedUser);
  // }

  // async remove(uuid: string): Promise<void> {
  //   await this.usersRepository.delete({ uuid });
  // }
}
