import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { UserQueryDto } from '../dto/user-query.dto';
import {
  paginationMeta,
  successResponse,
} from '../../../common/utils/api-response.util';
import { UserRole } from '../../../common/constants';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getStats(role?: string) {
    const stats = await this.userRepository.getStats(role);
    return successResponse(stats, 'Thống kê người dùng');
  }

  async findAll(query: UserQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.userRepository.findAll(query);
    return successResponse(
      UserMapper.toResponseList(data),
      'Users retrieved',
      paginationMeta(page, limit, total),
    );
  }

  async findOne(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new BusinessException('User not found', 404);
    return successResponse(UserMapper.toResponse(user));
  }

  async create(dto: CreateUserDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new BusinessException('Email already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.create({
      id: randomUUID(),
      email: dto.email,
      password: hashed,
      fullName: dto.fullName,
      phone: dto.phone,
      role: dto.role ?? UserRole.CUSTOMER,
    });
    return successResponse(UserMapper.toResponse(user), 'User created');
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.update(id, dto);
    if (!user) throw new BusinessException('User not found', 404);
    return successResponse(UserMapper.toResponse(user), 'User updated');
  }
}
