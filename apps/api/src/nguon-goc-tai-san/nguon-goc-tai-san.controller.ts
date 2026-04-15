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
  CreateNguonGocTaiSanDto,
  DeleteNguonGocTaiSanResponseDto,
  NguonGocTaiSanDto,
  NguonGocTaiSanListResponseDto,
  UpdateNguonGocTaiSanDto,
} from '@repo/shared';
import {
  CreateNguonGocTaiSanRequestBody,
  DeleteNguonGocTaiSanResponseBody,
  NguonGocTaiSanListResponseBody,
  NguonGocTaiSanQueryRequest,
  NguonGocTaiSanResponseBody,
  UpdateNguonGocTaiSanRequestBody,
} from './nguon-goc-tai-san.docs';
import { NguonGocTaiSanService } from './nguon-goc-tai-san.service';

@ApiTags('Nguon goc tai san')
@ApiBearerAuth('bearer')
@Controller('nguon-goc-tai-san')
export class NguonGocTaiSanController {
  constructor(private readonly nguonGocTaiSanService: NguonGocTaiSanService) {}

  @ApiOperation({
    summary: 'Lấy danh sách nguồn gốc tài sản',
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
    description: 'Tìm kiếm theo mã hoặc tên nguồn gốc tài sản',
    example: 'ngan sach',
  })
  @ApiOkResponse({ type: NguonGocTaiSanListResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Get()
  findAll(
    @Query() query: NguonGocTaiSanQueryRequest,
  ): Promise<NguonGocTaiSanListResponseDto> {
    return this.nguonGocTaiSanService.list(query);
  }

  @ApiOperation({ summary: 'Lấy chi tiết một nguồn gốc tài sản theo ID' })
  @ApiOkResponse({ type: NguonGocTaiSanResponseBody })
  @ApiNotFoundResponse({ description: 'Không tìm thấy nguồn gốc tài sản' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<NguonGocTaiSanDto> {
    return this.nguonGocTaiSanService.getById(id);
  }

  @ApiOperation({ summary: 'Thêm mới nguồn gốc tài sản' })
  @ApiOkResponse({ type: NguonGocTaiSanResponseBody })
  @ApiBadRequestResponse({
    description: 'Tên nguồn gốc tài sản không được để trống',
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Post()
  create(
    @Body() payload: CreateNguonGocTaiSanRequestBody,
  ): Promise<NguonGocTaiSanDto> {
    return this.nguonGocTaiSanService.createItem(
      payload as CreateNguonGocTaiSanDto,
    );
  }

  @ApiOperation({ summary: 'Cập nhật nguồn gốc tài sản theo ID' })
  @ApiOkResponse({ type: NguonGocTaiSanResponseBody })
  @ApiBadRequestResponse({
    description: 'Tên nguồn gốc tài sản không được để trống',
  })
  @ApiNotFoundResponse({ description: 'Không tìm thấy nguồn gốc tài sản' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateNguonGocTaiSanRequestBody,
  ): Promise<NguonGocTaiSanDto> {
    return this.nguonGocTaiSanService.updateItem(
      id,
      payload as UpdateNguonGocTaiSanDto,
    );
  }

  @ApiOperation({ summary: 'Xóa nguồn gốc tài sản theo ID' })
  @ApiOkResponse({ type: DeleteNguonGocTaiSanResponseBody })
  @ApiConflictResponse({
    description: 'Từ chối xóa nếu có thiết bị đang liên kết với nguồn gốc này',
  })
  @ApiNotFoundResponse({ description: 'Không tìm thấy nguồn gốc tài sản' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteNguonGocTaiSanResponseDto> {
    return this.nguonGocTaiSanService.removeItem(id);
  }
}
