import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { SupabaseService } from '../database';
import { NguoiDungService } from './nguoi-dung.service';

describe('NguoiDungService', () => {
  let client: {
    from: jest.Mock;
  };
  let service: NguoiDungService;

  beforeEach(() => {
    client = {
      from: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn(() => client),
    } as unknown as SupabaseService;

    service = new NguoiDungService(supabaseService);
  });

  it('creates employee with hashed default password', async () => {
    const availabilityBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };
    const createBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          ho_ten: 'Nguyen Van A',
          ten_dang_nhap: 'nguyenvana',
          email: 'a@example.com',
          so_dien_thoai: '0901234567',
          phong_ban_id: 2,
          trang_thai: true,
          vai_tro: 'User',
        },
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(availabilityBuilder)
      .mockReturnValueOnce(createBuilder);

    const result = await service.create({
      name: 'Nguyen Van A',
      username: 'nguyenvana',
      email: 'a@example.com',
      phoneNumber: '0901234567',
      departmentId: 2,
      role: 'User',
    });

    const insertCalls = createBuilder.insert.mock.calls as Array<
      [{ mat_khau: string }]
    >;
    const insertPayload = insertCalls[0][0];

    expect(await bcrypt.compare('123456', insertPayload.mat_khau)).toBe(true);
    expect(result).toEqual({
      id: 1,
      name: 'Nguyen Van A',
      username: 'nguyenvana',
      email: 'a@example.com',
      phoneNumber: '0901234567',
      departmentId: 2,
      isActive: true,
      role: 'User',
    });
  });

  it('rejects duplicate username on create', async () => {
    const availabilityBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      }),
    };

    client.from.mockReturnValue(availabilityBuilder);

    await expect(
      service.create({
        name: 'Nguyen Van A',
        username: 'nguyenvana',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('resets password with new hash', async () => {
    const findBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          ho_ten: 'Nguyen Van A',
          ten_dang_nhap: 'nguyenvana',
          email: null,
          mat_khau: 'old-hash',
          phong_ban_id: null,
          so_dien_thoai: null,
          trang_thai: true,
          vai_tro: 'User',
        },
        error: null,
      }),
    };
    const updateBuilder = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        error: null,
      }),
    };

    client.from
      .mockReturnValueOnce(findBuilder)
      .mockReturnValueOnce(updateBuilder);

    await service.resetPassword(1);

    const updateCalls = updateBuilder.update.mock.calls as Array<
      [{ mat_khau: string }]
    >;
    const updatePayload = updateCalls[0][0];

    expect(await bcrypt.compare('123456', updatePayload.mat_khau)).toBe(true);
  });
});
