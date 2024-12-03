import { ApiResponse } from '@app/shared-types';
import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { UniqueValidator } from '../common/validation';
import { CreateUserDto } from './dto/create-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { User } from './dto/user.dto';
import { UserEntity } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uniqueValidator: UniqueValidator,
  ) {}

  // TODO: add authorization / guard / policies

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    const user = await this.usersService.create(createUserDto);

    return { data: this.usersService.buildDto(user) };
  }

  @Get()
  async findAll(): Promise<ApiResponse<Array<User>>> {
    const users = await this.usersService.findAll();

    return { data: this.usersService.buildDtoArray(users) };
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string): Promise<ApiResponse<User>> {
    const user = await this.resolveUser(uuid);

    return { data: this.usersService.buildDto(user) };
  }

  @Patch(':uuid')
  async update(@Param('uuid') uuid: string, @Body() patchUserDto: PatchUserDto): Promise<ApiResponse<User>> {
    const user = await this.resolveUser(uuid);

    if (patchUserDto.email !== undefined && patchUserDto.email !== user.email) {
      await this.uniqueValidator.validateProperty({
        entityClass: UserEntity,
        column: 'email',
        value: patchUserDto.email,
        entityDisplayName: 'User',
      });
    }

    const updatedUser = await this.usersService.patch(user, patchUserDto);

    return { data: this.usersService.buildDto(updatedUser) };
  }

  @Delete(':uuid')
  async remove(@Param('uuid') uuid: string): Promise<void> {
    const user = await this.resolveUser(uuid);

    this.usersService.remove(user.uuid);
  }

  private async resolveUser(uuid: string): Promise<UserEntity> {
    const user = await this.usersService.findOne(uuid);

    if (user === null) {
      throw new NotFoundException();
    }

    return user;
  }
}
