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
  CreateHangModelDto,
  DeleteHangModelResponseDto,
  HangModelDto,
  HangModelListResponseDto,
  UpdateHangModelDto,
} from '@repo/shared';
import {
  CreateHangModelRequestBody,
  DeleteHangModelResponseBody,
  HangModelListResponseBody,
  HangModelQueryRequest,
  HangModelResponseBody,
  UpdateHangModelRequestBody,
} from './hang-model.docs';
import { HangModelService } from './hang-model.service';

@ApiTags('Hang model')
@ApiBearerAuth('bearer')
@Controller('hang-model')
export class HangModelController {
  constructor(private readonly hangModelService: HangModelService) {}

  @ApiOperation({
    summary: 'Lấy danh sách hãng/model có phân trang và tìm kiếm',
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
    description: 'Tìm kiếm theo tên hãng hoặc model',
    example: 'Dell',
  })
  @ApiOkResponse({ type: HangModelListResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Get()
  findAll(
    @Query() query: HangModelQueryRequest,
  ): Promise<HangModelListResponseDto> {
    return this.hangModelService.list(query);
  }

  @ApiOperation({ summary: 'Lấy chi tiết một hãng/model theo ID' })
  @ApiOkResponse({ type: HangModelResponseBody })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hãng/model' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<HangModelDto> {
    return this.hangModelService.getById(id);
  }

  @ApiOperation({ summary: 'Thêm mới hãng/model' })
  @ApiOkResponse({ type: HangModelResponseBody })
  @ApiBadRequestResponse({
    description: 'Tên hãng không được để trống',
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Post()
  create(@Body() payload: CreateHangModelRequestBody): Promise<HangModelDto> {
    return this.hangModelService.createItem(payload as CreateHangModelDto);
  }

  @ApiOperation({ summary: 'Cập nhật hãng/model theo ID' })
  @ApiOkResponse({ type: HangModelResponseBody })
  @ApiBadRequestResponse({
    description: 'Tên hãng không được để trống',
  })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hãng/model' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateHangModelRequestBody,
  ): Promise<HangModelDto> {
    return this.hangModelService.updateItem(id, payload as UpdateHangModelDto);
  }

  @ApiOperation({ summary: 'Xóa hãng/model theo ID' })
  @ApiOkResponse({ type: DeleteHangModelResponseBody })
  @ApiConflictResponse({
    description: 'Từ chối xóa nếu có thiết bị đang dùng hãng/model này',
  })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hãng/model' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteHangModelResponseDto> {
    return this.hangModelService.removeItem(id);
  }
}
