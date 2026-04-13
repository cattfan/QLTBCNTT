import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {
  ChangePasswordResponseDto,
  LoginResponseDto,
  MeResponseDto,
} from '@repo/shared';
import { Public } from './auth.decorators';
import { AuthService } from './auth.service';
import {
  ChangePasswordRequestBody,
  ChangePasswordResponseBody,
  LoginRequestBody,
  LoginResponseBody,
  MeResponseBody,
} from './auth.docs';
import type { AuthenticatedRequest } from './auth.types';

@ApiTags('Auth')
@ApiBearerAuth('bearer')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dang nhap va nhan JWT token' })
  @ApiBody({ type: LoginRequestBody })
  @ApiOkResponse({ type: LoginResponseBody })
  @ApiUnauthorizedResponse({ description: 'Sai ten dang nhap hoac mat khau' })
  @Post('login')
  login(@Body() payload: LoginRequestBody): Promise<LoginResponseDto> {
    return this.authService.login(payload);
  }

  @ApiOperation({ summary: 'Lay thong tin nguoi dang dang nhap' })
  @ApiOkResponse({ type: MeResponseBody })
  @ApiUnauthorizedResponse({ description: 'Token khong hop le hoac het han' })
  @Get('me')
  me(@Req() request: AuthenticatedRequest): Promise<MeResponseDto> {
    return this.authService.getMe(request.user!.id);
  }

  @ApiOperation({ summary: 'Doi mat khau tai khoan hien tai' })
  @ApiBody({ type: ChangePasswordRequestBody })
  @ApiOkResponse({ type: ChangePasswordResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Token khong hop le hoac mat khau cu khong dung',
  })
  @Patch('change-password')
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() payload: ChangePasswordRequestBody,
  ): Promise<ChangePasswordResponseDto> {
    return this.authService.changePassword(request.user!.id, payload);
  }
}
