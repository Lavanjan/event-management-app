import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { VerifyUserDto, ResendVerificationDto, VerifyByTokenDto } from './dto/verify-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireUserType } from '../auth/decorators/user-type.decorator';
import { UserType, User } from '../../database/entities';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(SecureAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'role', required: false, enum: UserType })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(@Query() findUsersDto: FindUsersDto, @CurrentUser() currentUser: User) {
    return this.usersService.findAll(findUsersDto, currentUser);
  }

  @Get('organization')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get users for current organization' })
  @ApiResponse({ status: 200, description: 'Organization users retrieved successfully' })
  findOrganizationUsers(
    @CurrentOrganization() organizationId: string,
    @Query() findUsersDto: FindUsersDto
  ) {
    return this.usersService.findByOrganization(organizationId, findUsersDto);
  }

  @Get(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/activate')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.activate(id);
  }

  @Patch(':id/deactivate')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }

  @Post('verify')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Verify user with OTP code' })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification code' })
  verify(@Body() verifyUserDto: VerifyUserDto) {
    return this.usersService.verifyUser(verifyUserDto);
  }

  @Post('verify-token')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Verify user with token from email link' })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification token' })
  verifyByToken(@Body() verifyByTokenDto: VerifyByTokenDto) {
    return this.usersService.verifyByToken(verifyByTokenDto);
  }

  @Post('resend-verification')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Resend verification email to user' })
  @ApiResponse({ status: 200, description: 'Verification email sent successfully' })
  @ApiResponse({
    status: 400,
    description: 'User does not require verification or is already verified',
  })
  resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.usersService.resendVerification(resendVerificationDto);
  }
}
