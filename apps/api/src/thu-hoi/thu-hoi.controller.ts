import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CreateThuHoiDto, ThuHoiResponseDto } from '@repo/shared';
import {
  CreateThuHoiRequestBody,
  ThuHoiActionResponseBody,
} from './thu-hoi.docs';
import { ThuHoiService } from './thu-hoi.service';

@ApiTags('Thu hoi')
@ApiBearerAuth('bearer')
@Controller('thu-hoi')
export class ThuHoiController {
  constructor(private readonly thuHoiService: ThuHoiService) {}

  @ApiOperation({
    summary: 'Thu hoi thiet bi dang duoc ban giao',
  })
  @ApiBody({ type: CreateThuHoiRequestBody })
  @ApiOkResponse({ type: ThuHoiActionResponseBody })
  @ApiConflictResponse({
    description: 'Khong co ban giao dang mo cho thiet bi nay',
  })
  @ApiNotFoundResponse({ description: 'Khong tim thay thiet bi' })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Post()
  create(@Body() payload: CreateThuHoiRequestBody): Promise<ThuHoiResponseDto> {
    return this.thuHoiService.create(payload as CreateThuHoiDto);
  }
}
