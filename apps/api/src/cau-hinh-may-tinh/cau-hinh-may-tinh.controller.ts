import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CauHinhMayTinhDto, UpsertCauHinhMayTinhDto } from '@repo/shared';
import {
  CauHinhMayTinhResponseBody,
  UpsertCauHinhMayTinhRequestBody,
} from './cau-hinh-may-tinh.docs';
import { CauHinhMayTinhService } from './cau-hinh-may-tinh.service';

@ApiTags('Cau hinh may tinh')
@ApiBearerAuth('bearer')
@Controller('cau-hinh-may-tinh')
export class CauHinhMayTinhController {
  constructor(private readonly cauHinhMayTinhService: CauHinhMayTinhService) {}

  @ApiOperation({
    summary: 'Lay cau hinh may tinh theo thiet bi',
  })
  @ApiOkResponse({ type: CauHinhMayTinhResponseBody })
  @ApiNotFoundResponse({
    description: 'Khong tim thay thiet bi hoac chua co cau hinh',
  })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get('thiet-bi/:thietBiId')
  getByDeviceId(
    @Param('thietBiId', ParseIntPipe) thietBiId: number,
  ): Promise<CauHinhMayTinhDto> {
    return this.cauHinhMayTinhService.getByDeviceId(thietBiId);
  }

  @ApiOperation({
    summary: 'Cap nhat thong so phan cung cho mot thiet bi',
  })
  @ApiBody({ type: UpsertCauHinhMayTinhRequestBody })
  @ApiOkResponse({ type: CauHinhMayTinhResponseBody })
  @ApiNotFoundResponse({ description: 'Khong tim thay thiet bi' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Put('thiet-bi/:thietBiId')
  upsertByDeviceId(
    @Param('thietBiId', ParseIntPipe) thietBiId: number,
    @Body() payload: UpsertCauHinhMayTinhRequestBody,
  ): Promise<CauHinhMayTinhDto> {
    return this.cauHinhMayTinhService.upsertByDeviceId(
      thietBiId,
      payload as UpsertCauHinhMayTinhDto,
    );
  }
}
