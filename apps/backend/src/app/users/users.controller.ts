import { ApiResponse, PaginatedApiResponse } from '@app/shared-types';
import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiExtraModels, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiPaginationQueryParams, ApiValidationErrorResponse } from '../common/decorators';
import { buildDtoArray, buildPaginationParams, getResponseSchema } from '../common/util';
import { UniqueValidator } from '../common/validation';
import { CreateUserDto } from './dto/create-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { UserDto } from './dto/user.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiExtraModels(UserDto)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uniqueValidator: UniqueValidator,
  ) {}

  // TODO: add authorization / guard / policies

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({
    schema: getResponseSchema(UserDto),
  })
  @ApiValidationErrorResponse()
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponse<UserDto>> {
    const user = await this.usersService.create(createUserDto);

    return { data: this.usersService.buildDto(user) };
  }

  @Get()
  @ApiOperation({ summary: 'Return all users' })
  @ApiPaginationQueryParams()
  @ApiOkResponse({
    schema: getResponseSchema(UserDto, { isArray: true, hasPagination: true }),
  })
  async findAll(@Query() queryParams: Record<string, string>): Promise<PaginatedApiResponse<Array<UserDto>>> {
    const paginationParams = buildPaginationParams(queryParams);

    const { users, paginationMeta } = await this.usersService.findAll({ pagination: paginationParams });

    return { data: buildDtoArray(users, (user) => this.usersService.buildDto(user)), meta: paginationMeta };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Return a user by UUID' })
  @ApiOkResponse({
    schema: getResponseSchema(UserDto),
  })
  @ApiNotFoundResponse()
  async findOne(@Param('uuid') uuid: string): Promise<ApiResponse<UserDto>> {
    const user = await this.resolveUser(uuid);

    return { data: this.usersService.buildDto(user) };
  }

  @Patch(':uuid')
  @ApiOperation({ summary: 'Update a user by UUID' })
  @ApiOkResponse({
    schema: getResponseSchema(UserDto),
  })
  @ApiNotFoundResponse()
  @ApiValidationErrorResponse()
  async update(@Param('uuid') uuid: string, @Body() patchUserDto: PatchUserDto): Promise<ApiResponse<UserDto>> {
    const user = await this.resolveUser(uuid);

    if (patchUserDto.email !== undefined && patchUserDto.email !== user.email) {
      await this.uniqueValidator.validateProperty({
        entityClass: User,
        column: 'email',
        value: patchUserDto.email,
        entityDisplayName: 'User',
      });
    }

    const updatedUser = await this.usersService.patch(user, patchUserDto);

    return { data: this.usersService.buildDto(updatedUser) };
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Delete a user by UUID' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  async remove(@Param('uuid') uuid: string): Promise<void> {
    const user = await this.resolveUser(uuid);

    this.usersService.remove(user.uuid);
  }

  private async resolveUser(uuid: string): Promise<User> {
    const user = await this.usersService.findOne(uuid);

    if (user === null) {
      throw new NotFoundException();
    }

    return user;
  }
}
