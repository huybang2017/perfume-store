import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import {
  paginationMeta,
  successResponse,
} from '../../../common/utils/api-response.util';
import { CreateVoucherDto } from '../dto/create-voucher.dto';
import { UpdateVoucherDto } from '../dto/update-voucher.dto';
import { ValidateVoucherDto } from '../dto/validate-voucher.dto';
import { VoucherQueryDto } from '../dto/voucher-query.dto';
import { VoucherMapper } from '../mappers/voucher.mapper';
import { VoucherRepository } from '../repositories/voucher.repository';
import { VoucherValidator } from '../validators/voucher.validator';

@Injectable()
export class VoucherService {
  constructor(private readonly voucherRepository: VoucherRepository) {}

  async getStats() {
    const stats = await this.voucherRepository.getStats();
    return successResponse(stats, 'Voucher statistics');
  }

  async findAll(query: VoucherQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.voucherRepository.findAll(query);
    return successResponse(
      VoucherMapper.toResponseList(data),
      'Vouchers retrieved',
      paginationMeta(page, limit, total),
    );
  }

  async findOne(id: string) {
    const voucher = await this.voucherRepository.findById(id);
    if (!voucher) throw new BusinessException('Voucher not found', 404);
    return successResponse(VoucherMapper.toResponse(voucher));
  }

  async create(dto: CreateVoucherDto) {
    const existing = await this.voucherRepository.findByCode(dto.code);
    if (existing) throw new BusinessException('Voucher code already exists');

    const voucher = await this.voucherRepository.create({
      id: randomUUID(),
      code: dto.code,
      description: dto.description,
      type: dto.type,
      value: String(dto.value),
      minOrderAmount: dto.minOrderAmount
        ? String(dto.minOrderAmount)
        : undefined,
      maxDiscount: dto.maxDiscount ? String(dto.maxDiscount) : undefined,
      usageLimit: dto.usageLimit,
      startsAt: dto.startsAt,
      expiresAt: dto.expiresAt,
      isActive: dto.isActive ?? true,
      usedCount: 0,
    });
    return successResponse(
      VoucherMapper.toResponse(voucher),
      'Voucher created',
    );
  }

  async update(id: string, dto: UpdateVoucherDto) {
    const payload: Record<string, unknown> = { ...dto };
    if (dto.value !== undefined) payload.value = String(dto.value);
    if (dto.minOrderAmount !== undefined)
      payload.minOrderAmount = String(dto.minOrderAmount);
    if (dto.maxDiscount !== undefined)
      payload.maxDiscount = String(dto.maxDiscount);

    const voucher = await this.voucherRepository.update(id, payload);
    if (!voucher) throw new BusinessException('Voucher not found', 404);
    return successResponse(
      VoucherMapper.toResponse(voucher),
      'Voucher updated',
    );
  }

  async remove(id: string) {
    const voucher = await this.voucherRepository.findById(id);
    if (!voucher) throw new BusinessException('Voucher not found', 404);
    await this.voucherRepository.delete(id);
    return successResponse(null, 'Voucher deleted');
  }

  async validate(dto: ValidateVoucherDto) {
    const voucher = await this.voucherRepository.findByCode(dto.code);
    if (!voucher) throw new BusinessException('Invalid voucher code', 404);

    VoucherValidator.assertUsable(voucher, dto.orderAmount);
    const discount = VoucherValidator.calculateDiscount(
      voucher,
      dto.orderAmount,
    );

    return successResponse({
      code: voucher.code,
      type: voucher.type,
      discount,
      finalAmount: dto.orderAmount - discount,
    });
  }

  /** Used internally by order checkout */
  async resolveDiscount(
    code: string | undefined,
    subtotal: number,
  ): Promise<{ discount: number; voucherCode?: string; voucherId?: string }> {
    if (!code) return { discount: 0 };

    const voucher = await this.voucherRepository.findByCode(code);
    if (!voucher) throw new BusinessException('Invalid voucher code');

    VoucherValidator.assertUsable(voucher, subtotal);
    const discount = VoucherValidator.calculateDiscount(voucher, subtotal);

    return {
      discount,
      voucherCode: voucher.code,
      voucherId: voucher.id,
    };
  }

  async applyUsage(voucherId: string) {
    await this.voucherRepository.incrementUsedCount(voucherId);
  }
}
