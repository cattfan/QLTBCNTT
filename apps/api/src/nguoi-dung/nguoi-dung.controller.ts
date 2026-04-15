import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {
  ActionMessageResponseDto,
  CreateNguoiDungDto,
  NguoiDungDto,
  NguoiDungListResponseDto,
  SetNguoiDungRoleDto,
  UpdateNguoiDungDto,
} from '@repo/shared';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ItOnlyGuard } from './it-only.guard';
import {
  ActionMessageResponseBody,
  CreateNguoiDungRequestBody,
  NguoiDungListResponseBody,
  NguoiDungQueryRequest,
  NguoiDungResponseBody,
  SetNguoiDungRoleRequestBody,
  UpdateNguoiDungRequestBody,
} from './nguoi-dung.docs';
import { NguoiDungService } from './nguoi-dung.service';

@ApiTags('Nguoi dung')
@ApiBearerAuth('bearer')
@UseGuards(ItOnlyGuard)
@Controller('nguoi-dung')
export class NguoiDungController {
  constructor(private readonly nguoiDungService: NguoiDungService) {}

  @ApiOperation({
    summary: 'Lay danh sach tai khoan, loc theo chuc vu va phong ban',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    example: 'IT',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: Number,
    example: 2,
  })
  @ApiOkResponse({ type: NguoiDungListResponseBody })
  @ApiUnauthorizedResponse({ description: 'Chua dang nhap' })
  @ApiForbiddenResponse({ description: 'Chi IT duoc phep' })
  @Get()
  findAll(
    @Query() query: NguoiDungQueryRequest,
  ): Promise<NguoiDungListResponseDto> {
    return this.nguoiDungService.findAll(query);
  }

  @ApiOperation({
    summary: 'Them nhan vien moi va tu dong bam mat khau mac dinh',
  })
  @ApiOkResponse({ type: NguoiDungResponseBody })
  @ApiConflictResponse({ description: 'Ten dang nhap da ton tai' })
  @ApiBadRequestResponse({ description: 'Du lieu dau vao khong hop le' })
  @ApiUnauthorizedResponse({ description: 'Chua dang nhap' })
  @ApiForbiddenResponse({ description: 'Chi IT duoc phep' })
  @Post()
  create(@Body() payload: CreateNguoiDungRequestBody): Promise<NguoiDungDto> {
    return this.nguoiDungService.create(payload as CreateNguoiDungDto);
  }

  @ApiOperation({
    summary: 'Cap nhat nhan vien, khong cho phep doi ten dang nhap',
  })
  @ApiOkResponse({ type: NguoiDungResponseBody })
  @ApiBadRequestResponse({ description: 'Du lieu dau vao khong hop le' })
  @ApiUnauthorizedResponse({ description: 'Chua dang nhap' })
  @ApiForbiddenResponse({ description: 'Chi IT duoc phep' })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Body() payload: UpdateNguoiDungRequestBody,
  ): Promise<NguoiDungDto> {
    if (request.body && 'username' in request.body) {
      throw new ForbiddenException('Khong duoc phep doi ten dang nhap');
    }

    return this.nguoiDungService.update(id, payload as UpdateNguoiDungDto);
  }

  @ApiOperation({ summary: 'Dat lai mat khau mac dinh cho nhan vien' })
  @ApiOkResponse({ type: ActionMessageResponseBody })
  @ApiUnauthorizedResponse({ description: 'Chua dang nhap' })
  @ApiForbiddenResponse({ description: 'Chi IT duoc phep' })
  @Patch(':id/reset-password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ActionMessageResponseDto> {
    return this.nguoiDungService.resetPassword(id);
  }

  @ApiOperation({ summary: 'Khoa tai khoan nhan vien' })
  @ApiOkResponse({ type: ActionMessageResponseBody })
  @ApiUnauthorizedResponse({ description: 'Chua dang nhap' })
  @ApiForbiddenResponse({ description: 'Chi IT duoc phep' })
  @Patch(':id/lock')
  lock(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ActionMessageResponseDto> {
    return this.nguoiDungService.lock(id);
  }

  @ApiOperation({ summary: 'Mo khoa tai khoan nhan vien' })
  @ApiOkResponse({ type: ActionMessageResponseBody })
  @ApiUnauthorizedResponse({ description: 'Chua dang nhap' })
  @ApiForbiddenResponse({ description: 'Chi IT duoc phep' })
  @Patch(':id/unlock')
  unlock(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ActionMessageResponseDto> {
    return this.nguoiDungService.unlock(id);
  }

  @ApiOperation({ summary: 'Gan vai tro IT hoac User cho nhan vien' })
  @ApiOkResponse({ type: ActionMessageResponseBody })
  @ApiBadRequestResponse({ description: 'Vai tro khong hop le' })
  @ApiUnauthorizedResponse({ description: 'Chua dang nhap' })
  @ApiForbiddenResponse({ description: 'Chi IT duoc phep' })
  @Patch(':id/role')
  setRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: SetNguoiDungRoleRequestBody,
  ): Promise<ActionMessageResponseDto> {
    return this.nguoiDungService.setRole(id, payload as SetNguoiDungRoleDto);
  }
}
