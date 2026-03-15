import { Auth } from '@backend/auth';
import {
  ApiAuth,
  ApiPaginationQueryParams,
  ApiValidationErrorResponse,
  EmailMustBeVerified,
  QueryPaginationParams,
  ResolveEntity,
} from '@backend/decorators';
import { ApiResponseDto, ApiResponseWithPaginationDto, type PaginationParams } from '@backend/models';
import { HasPermission, Permission, PermissionFailMode } from '@backend/permissions';
import { buildDtoArray, getResponseSchema } from '@backend/util';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { PatchAuthUserDto } from './dto/patch-auth-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { DetailedUserDto, UserDto } from './dto/user.dto';
import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('users')
@ApiAuth({ emailMustBeVerified: true })
@ApiTags('Users')
@ApiExtraModels(UserDto)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HasPermission(Permission.CreateUser)
  @ApiOperation({ summary: 'Creates a user' })
  @ApiCreatedResponse({
    description: 'OK',
    schema: getResponseSchema(DetailedUserDto),
  })
  @ApiValidationErrorResponse()
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto<DetailedUserDto>> {
    const user = await this.userService.create(createUserDto);

    return { data: DetailedUserDto.fromEntity(user) };
  }

  @Get()
  @HasPermission(Permission.ReadAllUsers)
  @ApiOperation({ summary: 'Returns all users' })
  @ApiPaginationQueryParams()
  @ApiOkResponse({
    description: 'OK',
    schema: getResponseSchema(UserDto, { isArray: true, hasPagination: true }),
  })
  async findAll(
    @QueryPaginationParams() paginationParams: PaginationParams,
  ): Promise<ApiResponseWithPaginationDto<Array<UserDto>>> {
    const { users, paginationMeta } = await this.userService.findAll({ pagination: paginationParams });

    return { data: buildDtoArray(users, UserDto.fromEntity), meta: paginationMeta };
  }

  @Get(':uuid')
  @HasPermission(Permission.ReadUser, { failMode: PermissionFailMode.NotFound })
  @ApiOperation({ summary: 'Returns a user by UUID' })
  @ApiOkResponse({
    description: 'OK',
    schema: getResponseSchema(UserDto),
  })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findOne(@ResolveEntity('uuid') user: User): Promise<ApiResponseDto<UserDto>> {
    return { data: UserDto.fromEntity(user) };
  }

  @Patch()
  @HasPermission(Permission.UpdateAuthUser)
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
    @Body() patchAuthUserDto: PatchAuthUserDto,
  ): Promise<ApiResponseDto<DetailedUserDto>> {
    const updatedUser = await this.userService.patch(user, patchAuthUserDto);

    return { data: DetailedUserDto.fromEntity(updatedUser) };
  }

  @Patch(':uuid')
  @HasPermission(Permission.UpdateUser)
  @ApiOperation({
    summary: 'Updates a user by UUID',
    description: 'Allows updating of additional fields. This route is only accessible by admins',
  })
  @ApiOkResponse({
    description: 'OK',
    schema: getResponseSchema(DetailedUserDto),
  })
  @ApiNotFoundResponse({ description: 'Not found' })
  @ApiValidationErrorResponse()
  async update(
    @ResolveEntity('uuid') user: User,
    @Body() patchUserDto: PatchUserDto,
  ): Promise<ApiResponseDto<DetailedUserDto>> {
    const updatedUser = await this.userService.patch(user, patchUserDto);

    return { data: DetailedUserDto.fromEntity(updatedUser) };
  }

  @Delete(':uuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HasPermission(Permission.DeleteUser, { failMode: PermissionFailMode.NotFound })
  @ApiOperation({ summary: 'Deletes a user by UUID' })
  @ApiNoContentResponse({ description: 'OK' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async remove(@ResolveEntity('uuid') user: User): Promise<void> {
    await this.userService.remove(user.uuid);
  }
}
