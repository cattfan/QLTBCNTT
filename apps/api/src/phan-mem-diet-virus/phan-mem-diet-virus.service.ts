import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type {
  CreatePhanMemDietVirusDto,
  DeletePhanMemDietVirusResponseDto,
  PhanMemDietVirusDto,
  PhanMemDietVirusListResponseDto,
  PhanMemDietVirusQueryDto,
  Tables,
  UpdatePhanMemDietVirusDto,
} from '@repo/shared';
import { BaseCrudService } from '../common';
import { SupabaseService } from '../database';

type PhanMemDietVirusRow = Tables<'phan_mem_diet_virus'>;

interface CountResult {
  count: number | null;
  error: { message: string } | null;
}

@Injectable()
export class PhanMemDietVirusService extends BaseCrudService<PhanMemDietVirusRow> {
  protected tableName = 'phan_mem_diet_virus';
  protected searchColumns = ['ten_phan_mem'];

  constructor(protected readonly supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async list(
    query: PhanMemDietVirusQueryDto,
  ): Promise<PhanMemDietVirusListResponseDto> {
    const result = await super.findAll(query);

    return {
      items: result.items.map((item) => this.toDto(item)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getById(id: number): Promise<PhanMemDietVirusDto> {
    const row = await super.findById(id);
    return this.toDto(row);
  }

  async createItem(
    payload: CreatePhanMemDietVirusDto,
  ): Promise<PhanMemDietVirusDto> {
    const normalizedPayload = this.normalizePayload(payload);
    const row = await super.create({
      ten_phan_mem: normalizedPayload.tenPhanMem,
      phien_ban: normalizedPayload.phienBan,
    });

    return this.toDto(row);
  }

  async updateItem(
    id: number,
    payload: UpdatePhanMemDietVirusDto,
  ): Promise<PhanMemDietVirusDto> {
    await super.findById(id);

    const normalizedPayload = this.normalizePayload(payload);
    const row = await super.update(id, {
      ten_phan_mem: normalizedPayload.tenPhanMem,
      phien_ban: normalizedPayload.phienBan,
    });

    return this.toDto(row);
  }

  async removeItem(id: number): Promise<DeletePhanMemDietVirusResponseDto> {
    await this.ensureSoftwareNotLinked(id);
    await super.remove(id);

    return {
      message: 'Xoa phan mem diet virus thanh cong',
    };
  }

  private async ensureSoftwareNotLinked(id: number): Promise<void> {
    const result = (await this.client
      .from('cau_hinh_may_tinh')
      .select('id', { count: 'exact', head: true })
      .eq('phan_mem_diet_virus_id', id)) as CountResult;

    if (result.error) {
      throw new InternalServerErrorException(
        'Khong the kiem tra lien ket phan mem diet virus',
      );
    }

    if ((result.count ?? 0) > 0) {
      throw new ConflictException(
        'Khong the xoa phan mem diet virus dang co thiet bi lien ket',
      );
    }
  }

  private normalizePayload(
    payload: CreatePhanMemDietVirusDto | UpdatePhanMemDietVirusDto,
  ): CreatePhanMemDietVirusDto {
    const tenPhanMem = this.requireNonEmpty(payload.tenPhanMem, 'Ten phan mem');
    const phienBan = this.normalizeOptionalText(payload.phienBan);

    return {
      tenPhanMem,
      phienBan,
    };
  }

  private toDto(row: PhanMemDietVirusRow): PhanMemDietVirusDto {
    return {
      id: row.id,
      tenPhanMem: row.ten_phan_mem,
      phienBan: row.phien_ban,
    };
  }

  private requireNonEmpty(value: string, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} khong hop le`);
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} khong duoc de trong`);
    }

    return normalizedValue;
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value == null) {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue ? normalizedValue : null;
  }
}
