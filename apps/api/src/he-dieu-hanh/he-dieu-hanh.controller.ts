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
  CreateHeDieuHanhDto,
  DeleteHeDieuHanhResponseDto,
  HeDieuHanhDto,
  HeDieuHanhListResponseDto,
  UpdateHeDieuHanhDto,
} from '@repo/shared';
import {
  CreateHeDieuHanhRequestBody,
  DeleteHeDieuHanhResponseBody,
  HeDieuHanhListResponseBody,
  HeDieuHanhQueryRequest,
  HeDieuHanhResponseBody,
  UpdateHeDieuHanhRequestBody,
} from './he-dieu-hanh.docs';
import { HeDieuHanhService } from './he-dieu-hanh.service';

@ApiTags('He dieu hanh')
@ApiBearerAuth('bearer')
@Controller('he-dieu-hanh')
export class HeDieuHanhController {
  constructor(private readonly heDieuHanhService: HeDieuHanhService) {}

  @ApiOperation({
    summary: 'Lay danh sach he dieu hanh co phan trang va tim kiem theo ten',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang hien tai',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'So ban ghi moi trang',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tim kiem theo ten he dieu hanh',
    example: 'Windows',
  })
  @ApiOkResponse({ type: HeDieuHanhListResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get()
  findAll(
    @Query() query: HeDieuHanhQueryRequest,
  ): Promise<HeDieuHanhListResponseDto> {
    return this.heDieuHanhService.findAll(query);
  }

  @ApiOperation({ summary: 'Lay chi tiet mot he dieu hanh theo ID' })
  @ApiOkResponse({ type: HeDieuHanhResponseBody })
  @ApiNotFoundResponse({ description: 'Khong tim thay he dieu hanh' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<HeDieuHanhDto> {
    return this.heDieuHanhService.findById(id);
  }

  @ApiOperation({ summary: 'Them moi he dieu hanh' })
  @ApiOkResponse({ type: HeDieuHanhResponseBody })
  @ApiBadRequestResponse({
    description: 'Ten he dieu hanh khong duoc de trong',
  })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Post()
  create(@Body() payload: CreateHeDieuHanhRequestBody): Promise<HeDieuHanhDto> {
    return this.heDieuHanhService.create(payload as CreateHeDieuHanhDto);
  }

  @ApiOperation({ summary: 'Cap nhat he dieu hanh theo ID' })
  @ApiOkResponse({ type: HeDieuHanhResponseBody })
  @ApiBadRequestResponse({
    description: 'Ten he dieu hanh khong duoc de trong',
  })
  @ApiNotFoundResponse({ description: 'Khong tim thay he dieu hanh' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateHeDieuHanhRequestBody,
  ): Promise<HeDieuHanhDto> {
    return this.heDieuHanhService.update(id, payload as UpdateHeDieuHanhDto);
  }

  @ApiOperation({ summary: 'Xoa he dieu hanh theo ID' })
  @ApiOkResponse({ type: DeleteHeDieuHanhResponseBody })
  @ApiConflictResponse({
    description: 'Tu choi xoa neu co thiet bi dang gan he dieu hanh nay',
  })
  @ApiNotFoundResponse({ description: 'Khong tim thay he dieu hanh' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteHeDieuHanhResponseDto> {
    return this.heDieuHanhService.remove(id);
  }
}
