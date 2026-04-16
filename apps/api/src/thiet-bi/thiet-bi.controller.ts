import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {
  CreateThietBiDto,
  DeleteThietBiResponseDto,
  ThietBiDto,
  ThietBiListResponseDto,
  UpdateThietBiDto,
} from '@repo/shared';
import {
  CreateThietBiRequestBody,
  DeleteThietBiResponseBody,
  ThietBiListResponseBody,
  ThietBiQueryRequest,
  ThietBiResponseBody,
  UpdateThietBiRequestBody,
} from './thiet-bi.docs';
import { ThietBiService } from './thiet-bi.service';

@ApiTags('Thiet bi')
@ApiBearerAuth('bearer')
@Controller('thiet-bi')
export class ThietBiController {
  constructor(private readonly thietBiService: ThietBiService) {}

  @ApiOperation({
    summary: 'Lay danh sach thiet bi co phan trang, tim kiem va loc',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'DELL',
  })
  @ApiQuery({
    name: 'phongBanId',
    required: false,
    type: Number,
    example: 2,
  })
  @ApiQuery({
    name: 'tinhTrangId',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'loaiThietBiId',
    required: false,
    type: Number,
    example: 3,
  })
  @ApiOkResponse({ type: ThietBiListResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get()
  findAll(
    @Query() query: ThietBiQueryRequest,
  ): Promise<ThietBiListResponseDto> {
    return this.thietBiService.list(query);
  }

  @ApiOperation({ summary: 'Lay chi tiet mot thiet bi theo ID' })
  @ApiOkResponse({ type: ThietBiResponseBody })
  @ApiNotFoundResponse({ description: 'Khong tim thay thiet bi' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<ThietBiDto> {
    return this.thietBiService.getById(id);
  }

  @ApiOperation({ summary: 'Them moi thiet bi' })
  @ApiOkResponse({ type: ThietBiResponseBody })
  @ApiBadRequestResponse({ description: 'Du lieu dau vao khong hop le' })
  @ApiConflictResponse({ description: 'Serial da ton tai' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Post()
  create(@Body() payload: CreateThietBiRequestBody): Promise<ThietBiDto> {
    return this.thietBiService.createItem(payload as CreateThietBiDto);
  }

  @ApiOperation({ summary: 'Cap nhat thiet bi theo ID' })
  @ApiOkResponse({ type: ThietBiResponseBody })
  @ApiBadRequestResponse({ description: 'Du lieu dau vao khong hop le' })
  @ApiConflictResponse({ description: 'Serial da ton tai' })
  @ApiNotFoundResponse({ description: 'Khong tim thay thiet bi' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateThietBiRequestBody,
  ): Promise<ThietBiDto> {
    return this.thietBiService.updateItem(id, payload as UpdateThietBiDto);
  }

  @ApiOperation({ summary: 'Xoa thiet bi theo ID' })
  @ApiOkResponse({ type: DeleteThietBiResponseBody })
  @ApiConflictResponse({
    description:
      'Tu choi xoa neu thiet bi dang duoc ban giao hoac dang sua chua',
  })
  @ApiNotFoundResponse({ description: 'Khong tim thay thiet bi' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteThietBiResponseDto> {
    return this.thietBiService.removeItem(id);
  }
}
