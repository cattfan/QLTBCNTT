import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {
  CloseSuaChuaBaoTriDto,
  CreateSuaChuaBaoTriDto,
  SuaChuaBaoTriActionResponseDto,
  SuaChuaBaoTriListResponseDto,
} from '@repo/shared';
import {
  CloseSuaChuaBaoTriRequestBody,
  CreateSuaChuaBaoTriRequestBody,
  SuaChuaBaoTriActionResponseBody,
  SuaChuaBaoTriListResponseBody,
  SuaChuaBaoTriQueryRequest,
} from './sua-chua-bao-tri.docs';
import { SuaChuaBaoTriService } from './sua-chua-bao-tri.service';

@ApiTags('Sua chua bao tri')
@ApiBearerAuth('bearer')
@Controller('sua-chua-bao-tri')
export class SuaChuaBaoTriController {
  constructor(private readonly suaChuaBaoTriService: SuaChuaBaoTriService) {}

  @ApiOperation({
    summary: 'Lay danh sach phieu sua chua/bao tri',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    example: 'dang_xu_ly',
  })
  @ApiOkResponse({ type: SuaChuaBaoTriListResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get()
  findAll(
    @Query() query: SuaChuaBaoTriQueryRequest,
  ): Promise<SuaChuaBaoTriListResponseDto> {
    return this.suaChuaBaoTriService.findAll(query);
  }

  @ApiOperation({ summary: 'Tao phieu sua chua/bao tri' })
  @ApiBody({ type: CreateSuaChuaBaoTriRequestBody })
  @ApiOkResponse({ type: SuaChuaBaoTriActionResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Post()
  create(
    @Body() payload: CreateSuaChuaBaoTriRequestBody,
  ): Promise<SuaChuaBaoTriActionResponseDto> {
    return this.suaChuaBaoTriService.create(payload as CreateSuaChuaBaoTriDto);
  }

  @ApiOperation({ summary: 'Dong phieu sua chua/bao tri' })
  @ApiBody({ type: CloseSuaChuaBaoTriRequestBody })
  @ApiOkResponse({ type: SuaChuaBaoTriActionResponseBody })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Patch(':id/close')
  close(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CloseSuaChuaBaoTriRequestBody,
  ): Promise<SuaChuaBaoTriActionResponseDto> {
    return this.suaChuaBaoTriService.close(
      id,
      payload as CloseSuaChuaBaoTriDto,
    );
  }
}
