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
  CreateTinhTrangThietBiDto,
  DeleteTinhTrangThietBiResponseDto,
  TinhTrangThietBiDto,
  TinhTrangThietBiListResponseDto,
  UpdateTinhTrangThietBiDto,
} from '@repo/shared';
import {
  CreateTinhTrangThietBiRequestBody,
  DeleteTinhTrangThietBiResponseBody,
  TinhTrangThietBiListResponseBody,
  TinhTrangThietBiQueryRequest,
  TinhTrangThietBiResponseBody,
  UpdateTinhTrangThietBiRequestBody,
} from './tinh-trang-thiet-bi.docs';
import { TinhTrangThietBiService } from './tinh-trang-thiet-bi.service';

@ApiTags('Tinh trang thiet bi')
@ApiBearerAuth('bearer')
@Controller('tinh-trang-thiet-bi')
export class TinhTrangThietBiController {
  constructor(
    private readonly tinhTrangThietBiService: TinhTrangThietBiService,
  ) {}

  @ApiOperation({
    summary: 'Lấy danh sách tình trạng thiết bị',
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
    description: 'Tìm kiếm theo tên tình trạng thiết bị',
    example: 'su dung',
  })
  @ApiOkResponse({ type: TinhTrangThietBiListResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Get()
  findAll(
    @Query() query: TinhTrangThietBiQueryRequest,
  ): Promise<TinhTrangThietBiListResponseDto> {
    return this.tinhTrangThietBiService.list(query);
  }

  @ApiOperation({ summary: 'Lấy chi tiết một tình trạng thiết bị theo ID' })
  @ApiOkResponse({ type: TinhTrangThietBiResponseBody })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy tình trạng thiết bị',
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Get(':id')
  findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TinhTrangThietBiDto> {
    return this.tinhTrangThietBiService.getById(id);
  }

  @ApiOperation({ summary: 'Thêm mới tình trạng thiết bị' })
  @ApiOkResponse({ type: TinhTrangThietBiResponseBody })
  @ApiBadRequestResponse({
    description: 'Tên tình trạng thiết bị không được để trống',
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Post()
  create(
    @Body() payload: CreateTinhTrangThietBiRequestBody,
  ): Promise<TinhTrangThietBiDto> {
    return this.tinhTrangThietBiService.createItem(
      payload as CreateTinhTrangThietBiDto,
    );
  }

  @ApiOperation({ summary: 'Cập nhật tình trạng thiết bị theo ID' })
  @ApiOkResponse({ type: TinhTrangThietBiResponseBody })
  @ApiBadRequestResponse({
    description: 'Tên tình trạng thiết bị không được để trống',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy tình trạng thiết bị',
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateTinhTrangThietBiRequestBody,
  ): Promise<TinhTrangThietBiDto> {
    return this.tinhTrangThietBiService.updateItem(
      id,
      payload as UpdateTinhTrangThietBiDto,
    );
  }

  @ApiOperation({ summary: 'Xóa tình trạng thiết bị theo ID' })
  @ApiOkResponse({ type: DeleteTinhTrangThietBiResponseBody })
  @ApiConflictResponse({
    description: 'Từ chối xóa nếu có thiết bị đang ở tình trạng này',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy tình trạng thiết bị',
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteTinhTrangThietBiResponseDto> {
    return this.tinhTrangThietBiService.removeItem(id);
  }
}
