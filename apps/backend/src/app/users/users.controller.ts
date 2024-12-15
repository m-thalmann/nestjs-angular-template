import { ApiResponse, PaginatedApiResponse } from '@app/shared-types';
import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthAbility } from '../auth';
import { ApiPaginationQueryParams, ApiValidationErrorResponse, AuthorizeAbility } from '../common/decorators';
import { buildDtoArray, buildPaginationParams, getResponseSchema } from '../common/util';
import { UniqueValidator } from '../common/validation';
import { CreateUserDto } from './dto/create-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { buildUserDto, UserDto } from './dto/user.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth('AccessToken')
@ApiExtraModels(UserDto)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uniqueValidator: UniqueValidator,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({
    schema: getResponseSchema(UserDto),
  })
  @ApiForbiddenResponse()
  @ApiValidationErrorResponse()
  async create(
    @AuthorizeAbility() ability: AuthAbility,
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponse<UserDto>> {
    ability.authorize('create', User);

    const user = await this.usersService.create(createUserDto);

    return { data: buildUserDto(user) };
  }

  @Get()
  @ApiOperation({ summary: 'Return all users' })
  @ApiPaginationQueryParams()
  @ApiOkResponse({
    schema: getResponseSchema(UserDto, { isArray: true, hasPagination: true }),
  })
  @ApiForbiddenResponse()
  async findAll(
    @AuthorizeAbility() ability: AuthAbility,
    @Query() queryParams: Record<string, string>,
  ): Promise<PaginatedApiResponse<Array<UserDto>>> {
    ability.authorize('readAll', User);

    const paginationParams = buildPaginationParams(queryParams);

    const { users, paginationMeta } = await this.usersService.findAll({ pagination: paginationParams });

    return { data: buildDtoArray(users, (user) => buildUserDto(user)), meta: paginationMeta };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Return a user by UUID' })
  @ApiOkResponse({
    schema: getResponseSchema(UserDto),
  })
  @ApiNotFoundResponse()
  async findOne(@AuthorizeAbility() ability: AuthAbility, @Param('uuid') uuid: string): Promise<ApiResponse<UserDto>> {
    const user = await this.resolveUser(uuid);

    ability.authorizeAnonymous('read', user);

    return { data: buildUserDto(user) };
  }

  @Patch(':uuid')
  @ApiOperation({ summary: 'Update a user by UUID' })
  @ApiOkResponse({
    schema: getResponseSchema(UserDto),
  })
  @ApiNotFoundResponse()
  @ApiValidationErrorResponse()
  async update(
    @AuthorizeAbility() ability: AuthAbility,
    @Param('uuid') uuid: string,
    @Body() patchUserDto: PatchUserDto,
  ): Promise<ApiResponse<UserDto>> {
    ability.authorize('manage', User);

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

    return { data: buildUserDto(updatedUser) };
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Delete a user by UUID' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  async remove(@AuthorizeAbility() authAbility: AuthAbility, @Param('uuid') uuid: string): Promise<void> {
    const user = await this.resolveUser(uuid);

    authAbility.authorize('delete', User);

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
