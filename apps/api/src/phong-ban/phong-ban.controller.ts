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
  CreatePhongBanDto,
  DeletePhongBanResponseDto,
  PhongBanDto,
  PhongBanListResponseDto,
  UpdatePhongBanDto,
} from '@repo/shared';
import {
  CreatePhongBanRequestBody,
  DeletePhongBanResponseBody,
  PhongBanListResponseBody,
  PhongBanQueryRequest,
  PhongBanResponseBody,
  UpdatePhongBanRequestBody,
} from './phong-ban.docs';
import { PhongBanService } from './phong-ban.service';

@ApiTags('Phong ban')
@ApiBearerAuth('bearer')
@Controller('phong-ban')
export class PhongBanController {
  constructor(private readonly phongBanService: PhongBanService) {}

  @ApiOperation({
    summary: 'Lấy danh sách phòng ban có phân trang và tìm kiếm',
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
    description: 'Tìm kiếm theo mã hoặc tên phòng ban',
    example: 'KT',
  })
  @ApiOkResponse({ type: PhongBanListResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Get()
  findAll(
    @Query() query: PhongBanQueryRequest,
  ): Promise<PhongBanListResponseDto> {
    return this.phongBanService.findAll(query);
  }

  @ApiOperation({ summary: 'Lấy chi tiết một phòng ban theo ID' })
  @ApiOkResponse({ type: PhongBanResponseBody })
  @ApiNotFoundResponse({ description: 'Không tìm thấy phòng ban' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<PhongBanDto> {
    return this.phongBanService.findById(id);
  }

  @ApiOperation({ summary: 'Thêm mới phòng ban' })
  @ApiOkResponse({ type: PhongBanResponseBody })
  @ApiBadRequestResponse({
    description: 'Mã phòng ban hoặc tên phòng ban để trống',
  })
  @ApiConflictResponse({ description: 'Mã phòng ban đã tồn tại' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Post()
  create(@Body() payload: CreatePhongBanRequestBody): Promise<PhongBanDto> {
    return this.phongBanService.create(payload as CreatePhongBanDto);
  }

  @ApiOperation({ summary: 'Cập nhật phòng ban theo ID' })
  @ApiOkResponse({ type: PhongBanResponseBody })
  @ApiBadRequestResponse({
    description: 'Mã phòng ban hoặc tên phòng ban để trống',
  })
  @ApiConflictResponse({ description: 'Mã phòng ban đã tồn tại' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy phòng ban' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePhongBanRequestBody,
  ): Promise<PhongBanDto> {
    return this.phongBanService.update(id, payload as UpdatePhongBanDto);
  }

  @ApiOperation({ summary: 'Xóa phòng ban theo ID' })
  @ApiOkResponse({ type: DeletePhongBanResponseBody })
  @ApiConflictResponse({
    description: 'Từ chối xóa nếu còn nhân viên hoặc thiết bị liên kết',
  })
  @ApiNotFoundResponse({ description: 'Không tìm thấy phòng ban' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeletePhongBanResponseDto> {
    return this.phongBanService.remove(id);
  }
}
