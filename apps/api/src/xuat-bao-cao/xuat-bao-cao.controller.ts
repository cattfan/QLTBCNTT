import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { ExportThietBiReportQueryDto } from '@repo/shared';
import type { AuthenticatedRequest } from '../auth/auth.types';
import {
  BINARY_FILE_SCHEMA,
  EXCEL_REPORT_CONTENT_TYPE,
  ExportThietBiReportQueryRequest,
  PDF_REPORT_CONTENT_TYPE,
} from './xuat-bao-cao.docs';
import { XuatBaoCaoService } from './xuat-bao-cao.service';

@ApiTags('Xuat bao cao')
@ApiBearerAuth('bearer')
@Controller('xuat-bao-cao')
export class XuatBaoCaoController {
  constructor(private readonly xuatBaoCaoService: XuatBaoCaoService) {}

  @ApiOperation({
    summary: 'Xuat danh sach thiet bi ra file Excel',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'DELL',
  })
  @ApiQuery({
    name: 'phongBanId',
    required: false,
    type: Number,
    example: 2,
  })
  @ApiQuery({
    name: 'tinhTrangId',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'loaiThietBiId',
    required: false,
    type: Number,
    example: 3,
  })
  @ApiProduces(EXCEL_REPORT_CONTENT_TYPE)
  @ApiOkResponse({
    description: 'File Excel danh sach thiet bi',
    content: {
      [EXCEL_REPORT_CONTENT_TYPE]: {
        schema: BINARY_FILE_SCHEMA,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get('thiet-bi/excel')
  async exportThietBiExcel(
    @Query() query: ExportThietBiReportQueryRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const report = await this.xuatBaoCaoService.exportThietBiExcel(
      query as ExportThietBiReportQueryDto,
    );

    response.setHeader('Content-Type', report.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.filename}"`,
    );

    return new StreamableFile(report.content);
  }

  @ApiOperation({
    summary: 'Xuat bien ban ban giao ra file PDF',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'ID ban ghi lich su ban giao',
  })
  @ApiProduces(PDF_REPORT_CONTENT_TYPE)
  @ApiOkResponse({
    description: 'File PDF bien ban ban giao',
    content: {
      [PDF_REPORT_CONTENT_TYPE]: {
        schema: BINARY_FILE_SCHEMA,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Chua dang nhap hoac token khong hop le',
  })
  @Get('ban-giao/:id/pdf')
  async exportBanGiaoPdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const report = await this.xuatBaoCaoService.exportBanGiaoPdf(id, {
      name:
        request.user?.name ?? request.user?.username ?? 'Nguoi lap bien ban',
      username: request.user?.username ?? '',
    });

    response.setHeader('Content-Type', report.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.filename}"`,
    );

    return new StreamableFile(report.content);
  }
}
