import { ApiResponse, PaginatedApiResponse } from '@app/shared-types';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthAbility } from '../auth/abilities/auth-ability';
import { EmailMustBeVerified } from '../auth/guards/auth.guard';
import { Auth } from '../common/decorators/auth-decorator';
import { AuthorizeAbility } from '../common/decorators/authorize-ability-decorator';
import { ApiAuth, ApiPaginationQueryParams, ApiValidationErrorResponse } from '../common/decorators/controller';
import { buildDtoArray } from '../common/util/build-dto.utils';
import { buildPaginationOptions } from '../common/util/pagination.utils';
import { getResponseSchema } from '../common/util/swagger.utils';
import { CreateUserDto } from './dto/create-user.dto';
import { PatchAuthUserDto } from './dto/patch-auth-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { buildUserDto, DetailedUserDto, UserDto } from './dto/user.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiAuth({ emailMustBeVerified: true })
@ApiTags('Users')
@ApiExtraModels(UserDto)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a user' })
  @ApiCreatedResponse({
    description: 'OK',
    schema: getResponseSchema(DetailedUserDto),
  })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiValidationErrorResponse()
  async create(
    @AuthorizeAbility() ability: AuthAbility,
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponse<DetailedUserDto>> {
    ability.authorize('create', User);

    const user = await this.usersService.create(createUserDto);

    return { data: buildUserDto(user, true) };
  }

  @Get()
  @ApiOperation({ summary: 'Returns all users' })
  @ApiPaginationQueryParams()
  @ApiOkResponse({
    description: 'OK',
    schema: getResponseSchema(UserDto, { isArray: true, hasPagination: true }),
  })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAll(
    @AuthorizeAbility() ability: AuthAbility,
    @Query() queryParams: Record<string, string>,
  ): Promise<PaginatedApiResponse<Array<UserDto>>> {
    ability.authorize('readAll', User);

    const paginationOptions = buildPaginationOptions(queryParams);

    const { users, paginationMeta } = await this.usersService.findAll({ pagination: paginationOptions });

    return { data: buildDtoArray(users, (user) => buildUserDto(user)), meta: paginationMeta };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Returns a user by UUID' })
  @ApiOkResponse({
    description: 'OK',
    schema: getResponseSchema(UserDto),
  })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findOne(@AuthorizeAbility() ability: AuthAbility, @Param('uuid') uuid: string): Promise<ApiResponse<UserDto>> {
    const user = await this.resolveUser(uuid);

    ability.authorizeAnonymous('read', user);

    return { data: buildUserDto(user) };
  }

  @Patch()
  @EmailMustBeVerified(false)
  @ApiOperation({ summary: 'Updates the authenticated user' })
  @ApiOkResponse({
    description: 'OK',
    schema: getResponseSchema(DetailedUserDto),
  })
  @ApiNotFoundResponse({ description: 'Not found' })
  @ApiValidationErrorResponse()
  async updateAuthUser(
    @Auth('user') user: User,
    @AuthorizeAbility() ability: AuthAbility,
    @Body() patchAuthUserDto: PatchAuthUserDto,
  ): Promise<ApiResponse<DetailedUserDto>> {
    ability.authorize('update', user, Object.keys(patchAuthUserDto));

    const updatedUser = await this.usersService.patch(user, patchAuthUserDto);

    return { data: buildUserDto(updatedUser, true) };
  }

  @Patch(':uuid')
  @ApiOperation({
    summary: 'Updates a user by UUID',
    description: 'Allows updating of additional fields. This route is only accessible by admins',
  })
  @ApiOkResponse({
    description: 'OK',
    schema: getResponseSchema(DetailedUserDto),
  })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Not found' })
  @ApiValidationErrorResponse()
  async update(
    @AuthorizeAbility() ability: AuthAbility,
    @Param('uuid') uuid: string,
    @Body() patchUserDto: PatchUserDto,
  ): Promise<ApiResponse<DetailedUserDto>> {
    ability.authorize('manage', User);

    const user = await this.resolveUser(uuid);

    const updatedUser = await this.usersService.patch(user, patchUserDto);

    return { data: buildUserDto(updatedUser, true) };
  }

  @Delete(':uuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @EmailMustBeVerified(false)
  @ApiOperation({ summary: 'Deletes a user by UUID' })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async remove(@AuthorizeAbility() authAbility: AuthAbility, @Param('uuid') uuid: string): Promise<void> {
    const user = await this.resolveUser(uuid);

    authAbility.authorizeAnonymous('delete', User);

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
