import { ApiPaginationQueryParams, ApiValidationErrorResponse, QueryPaginationParams } from '@backend/decorators';
import { ApiResponseDto, ApiResponseWithPaginationDto, PaginationParams } from '@backend/models';
import { getResponseSchema } from '@backend/util';
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
import { CreateUserDto } from './dto/create-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { DetailedUserDto, UserDto } from './dto/user.dto';
import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('users')
// @ApiAuth({ emailMustBeVerified: true })
@ApiTags('Users')
@ApiExtraModels(UserDto)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a user' })
  @ApiCreatedResponse({
    description: 'OK',
    schema: getResponseSchema(DetailedUserDto),
  })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiValidationErrorResponse()
  async create(
    // @AuthorizeAbility() ability: AuthAbility,
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponseDto<DetailedUserDto>> {
    // ability.authorize('create', User);

    const user = await this.userService.create(createUserDto);

    return { data: DetailedUserDto.fromEntity(user) };
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
    // @AuthorizeAbility() ability: AuthAbility,
    @QueryPaginationParams() paginationParams: PaginationParams,
  ): Promise<ApiResponseWithPaginationDto<Array<UserDto>>> {
    // ability.authorize('readAll', User);

    const { users, paginationMeta } = await this.userService.findAll({ pagination: paginationParams });

    return { data: DetailedUserDto.fromEntityArray(users), meta: paginationMeta };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Returns a user by UUID' })
  @ApiOkResponse({
    description: 'OK',
    schema: getResponseSchema(UserDto),
  })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findOne(
    // @AuthorizeAbility() ability: AuthAbility,
    @Param('uuid') uuid: string,
  ): Promise<ApiResponseDto<UserDto>> {
    const user = await this.resolveUser(uuid);

    // ability.authorizeAnonymous('read', user);

    return { data: UserDto.fromEntity(user) };
  }

  // @Patch()
  // @EmailMustBeVerified(false)
  // @ApiOperation({ summary: 'Updates the authenticated user' })
  // @ApiOkResponse({
  //   description: 'OK',
  //   schema: getResponseSchema(DetailedUserDto),
  // })
  // @ApiNotFoundResponse({ description: 'Not found' })
  // @ApiValidationErrorResponse()
  // async updateAuthUser(
  //   @Auth('user') user: User,
  //   @AuthorizeAbility() ability: AuthAbility,
  //   @Body() patchAuthUserDto: PatchAuthUserDto,
  // ): Promise<ApiResponse<DetailedUserDto>> {
  //   ability.authorize('update', user, Object.keys(patchAuthUserDto));

  //   const updatedUser = await this.usersService.patch(user, patchAuthUserDto);

  //   return { data: buildUserDto(updatedUser, true) };
  // }

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
    // @AuthorizeAbility() ability: AuthAbility,
    @Param('uuid') uuid: string,
    @Body() patchUserDto: PatchUserDto,
  ): Promise<ApiResponseDto<DetailedUserDto>> {
    // ability.authorize('manage', User);

    const user = await this.resolveUser(uuid);

    const updatedUser = await this.userService.patch(user, patchUserDto);

    return { data: DetailedUserDto.fromEntity(updatedUser) };
  }

  @Delete(':uuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  // @EmailMustBeVerified(false)
  @ApiOperation({ summary: 'Deletes a user by UUID' })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async remove(
    // @AuthorizeAbility() authAbility: AuthAbility,
    @Param('uuid') uuid: string,
  ): Promise<void> {
    const user = await this.resolveUser(uuid);

    // authAbility.authorizeAnonymous('delete', User);

    await this.userService.remove(user.uuid);
  }

  private async resolveUser(uuid: string): Promise<User> {
    const user = await this.userService.findOne(uuid);

    if (user === null) {
      throw new NotFoundException();
    }

    return user;
  }
}
