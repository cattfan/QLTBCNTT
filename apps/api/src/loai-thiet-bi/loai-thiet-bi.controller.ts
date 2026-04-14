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
  CreateLoaiThietBiDto,
  DeleteLoaiThietBiResponseDto,
  LoaiThietBiDto,
  LoaiThietBiListResponseDto,
  UpdateLoaiThietBiDto,
} from '@repo/shared';
import {
  CreateLoaiThietBiRequestBody,
  DeleteLoaiThietBiResponseBody,
  LoaiThietBiListResponseBody,
  LoaiThietBiQueryRequest,
  LoaiThietBiResponseBody,
  UpdateLoaiThietBiRequestBody,
} from './loai-thiet-bi.docs';
import { LoaiThietBiService } from './loai-thiet-bi.service';

@ApiTags('Loai thiet bi')
@ApiBearerAuth('bearer')
@Controller('loai-thiet-bi')
export class LoaiThietBiController {
  constructor(private readonly loaiThietBiService: LoaiThietBiService) {}

  @ApiOperation({
    summary: 'Lấy danh sách loại thiết bị có phân trang và tìm kiếm theo tên',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang hiện tại',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số bản ghi mỗi trang',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên loại thiết bị',
    example: 'Laptop',
  })
  @ApiOkResponse({ type: LoaiThietBiListResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Get()
  findAll(
    @Query() query: LoaiThietBiQueryRequest,
  ): Promise<LoaiThietBiListResponseDto> {
    return this.loaiThietBiService.findAll(query);
  }

  @ApiOperation({ summary: 'Lấy chi tiết một loại thiết bị theo ID' })
  @ApiOkResponse({ type: LoaiThietBiResponseBody })
  @ApiNotFoundResponse({ description: 'Không tìm thấy loại thiết bị' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<LoaiThietBiDto> {
    return this.loaiThietBiService.findById(id);
  }

  @ApiOperation({ summary: 'Thêm mới loại thiết bị' })
  @ApiOkResponse({ type: LoaiThietBiResponseBody })
  @ApiBadRequestResponse({
    description: 'Mã danh mục hoặc tên loại thiết bị để trống',
  })
  @ApiConflictResponse({ description: 'Mã danh mục đã tồn tại' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Post()
  create(
    @Body() payload: CreateLoaiThietBiRequestBody,
  ): Promise<LoaiThietBiDto> {
    return this.loaiThietBiService.create(payload as CreateLoaiThietBiDto);
  }

  @ApiOperation({ summary: 'Cập nhật loại thiết bị theo ID' })
  @ApiOkResponse({ type: LoaiThietBiResponseBody })
  @ApiBadRequestResponse({
    description: 'Mã danh mục hoặc tên loại thiết bị để trống',
  })
  @ApiConflictResponse({ description: 'Mã danh mục đã tồn tại' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy loại thiết bị' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateLoaiThietBiRequestBody,
  ): Promise<LoaiThietBiDto> {
    return this.loaiThietBiService.update(id, payload as UpdateLoaiThietBiDto);
  }

  @ApiOperation({ summary: 'Xóa loại thiết bị theo ID' })
  @ApiOkResponse({ type: DeleteLoaiThietBiResponseBody })
  @ApiConflictResponse({
    description: 'Từ chối xóa nếu có thiết bị đang thuộc loại này',
  })
  @ApiNotFoundResponse({ description: 'Không tìm thấy loại thiết bị' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteLoaiThietBiResponseDto> {
    return this.loaiThietBiService.remove(id);
  }
}
