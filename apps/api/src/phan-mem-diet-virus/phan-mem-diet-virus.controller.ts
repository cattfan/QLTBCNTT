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
  CreatePhanMemDietVirusDto,
  DeletePhanMemDietVirusResponseDto,
  PhanMemDietVirusDto,
  PhanMemDietVirusListResponseDto,
  UpdatePhanMemDietVirusDto,
} from '@repo/shared';
import {
  CreatePhanMemDietVirusRequestBody,
  DeletePhanMemDietVirusResponseBody,
  PhanMemDietVirusListResponseBody,
  PhanMemDietVirusQueryRequest,
  PhanMemDietVirusResponseBody,
  UpdatePhanMemDietVirusRequestBody,
} from './phan-mem-diet-virus.docs';
import { PhanMemDietVirusService } from './phan-mem-diet-virus.service';

@ApiTags('Phan mem diet virus')
@ApiBearerAuth('bearer')
@Controller('phan-mem-diet-virus')
export class PhanMemDietVirusController {
  constructor(
    private readonly phanMemDietVirusService: PhanMemDietVirusService,
  ) {}

  @ApiOperation({
    summary: 'Lay danh sach phan mem diet virus co phan trang va tim kiem',
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
    description: 'Tim kiem theo ten phan mem diet virus',
    example: 'Kaspersky',
  })
  @ApiOkResponse({ type: PhanMemDietVirusListResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get()
  findAll(
    @Query() query: PhanMemDietVirusQueryRequest,
  ): Promise<PhanMemDietVirusListResponseDto> {
    return this.phanMemDietVirusService.list(query);
  }

  @ApiOperation({ summary: 'Lay chi tiet mot phan mem diet virus theo ID' })
  @ApiOkResponse({ type: PhanMemDietVirusResponseBody })
  @ApiNotFoundResponse({ description: 'Khong tim thay phan mem diet virus' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get(':id')
  findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PhanMemDietVirusDto> {
    return this.phanMemDietVirusService.getById(id);
  }

  @ApiOperation({ summary: 'Them moi phan mem diet virus' })
  @ApiOkResponse({ type: PhanMemDietVirusResponseBody })
  @ApiBadRequestResponse({
    description: 'Ten phan mem diet virus khong duoc de trong',
  })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Post()
  create(
    @Body() payload: CreatePhanMemDietVirusRequestBody,
  ): Promise<PhanMemDietVirusDto> {
    return this.phanMemDietVirusService.createItem(
      payload as CreatePhanMemDietVirusDto,
    );
  }

  @ApiOperation({ summary: 'Cap nhat phan mem diet virus theo ID' })
  @ApiOkResponse({ type: PhanMemDietVirusResponseBody })
  @ApiBadRequestResponse({
    description: 'Ten phan mem diet virus khong duoc de trong',
  })
  @ApiNotFoundResponse({ description: 'Khong tim thay phan mem diet virus' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePhanMemDietVirusRequestBody,
  ): Promise<PhanMemDietVirusDto> {
    return this.phanMemDietVirusService.updateItem(
      id,
      payload as UpdatePhanMemDietVirusDto,
    );
  }

  @ApiOperation({ summary: 'Xoa phan mem diet virus theo ID' })
  @ApiOkResponse({ type: DeletePhanMemDietVirusResponseBody })
  @ApiConflictResponse({
    description: 'Tu choi xoa neu co thiet bi dang cai phan mem nay',
  })
  @ApiNotFoundResponse({ description: 'Khong tim thay phan mem diet virus' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeletePhanMemDietVirusResponseDto> {
    return this.phanMemDietVirusService.removeItem(id);
  }
}
