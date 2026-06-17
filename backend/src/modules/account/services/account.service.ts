import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { successResponse } from '../../../common/utils/api-response.util';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { AddressRepository } from '../repositories/address.repository';

function toAddressResponse(row: {
  id: string;
  userId: string;
  label: string | null;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    label: row.label,
    fullName: row.fullName,
    phone: row.phone,
    province: row.province,
    district: row.district,
    ward: row.ward,
    street: row.street,
    isDefault: row.isDefault,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class AccountService {
  constructor(private readonly addressRepository: AddressRepository) {}

  async listAddresses(userId: string) {
    const rows = await this.addressRepository.findByUser(userId);
    return successResponse(rows.map(toAddressResponse), 'Address list');
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.addressRepository.clearDefaultForUser(userId);
    }
    const row = await this.addressRepository.create({
      id: randomUUID(),
      userId,
      label: dto.label ?? null,
      fullName: dto.fullName,
      phone: dto.phone,
      province: dto.province,
      district: dto.district,
      ward: dto.ward,
      street: dto.street,
      isDefault: dto.isDefault ?? false,
    });
    return successResponse(toAddressResponse(row), 'Address added');
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    const existing = await this.addressRepository.findByIdForUser(id, userId);
    if (!existing) throw new BusinessException('Address not found', 404);

    if (dto.isDefault) {
      await this.addressRepository.clearDefaultForUser(userId);
    }

    const row = await this.addressRepository.update(id, userId, {
      label: dto.label,
      fullName: dto.fullName,
      phone: dto.phone,
      province: dto.province,
      district: dto.district,
      ward: dto.ward,
      street: dto.street,
      isDefault: dto.isDefault,
    });
    return successResponse(toAddressResponse(row!), 'Address updated');
  }

  async deleteAddress(userId: string, id: string) {
    const existing = await this.addressRepository.findByIdForUser(id, userId);
    if (!existing) throw new BusinessException('Address not found', 404);
    await this.addressRepository.delete(id, userId);
    return successResponse(null, 'Address deleted');
  }
}
