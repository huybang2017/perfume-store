import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { MSG } from '../../../common/i18n/messages.en';
import { UserRole } from '../../../common/constants';
import { successResponse } from '../../../common/utils/api-response.util';
import { UserMapper } from '../../users/mappers/user.mapper';
import { UserRepository } from '../../users/repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { MakeAdminDto } from '../dto/make-admin.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new UnauthorizedException(MSG.EMAIL_EXISTS);

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.create({
      id: randomUUID(),
      email: dto.email,
      password: hashed,
      fullName: dto.fullName,
      phone: dto.phone,
      role: UserRole.CUSTOMER,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException(MSG.INVALID_CREDENTIALS);
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException(MSG.INVALID_CREDENTIALS);

    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedException(MSG.USER_NOT_FOUND);
    return successResponse(UserMapper.toResponse(user));
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedException(MSG.USER_NOT_FOUND);

    const updated = await this.userRepository.update(userId, {
      fullName: dto.fullName,
      phone: dto.phone,
      avatar: dto.avatar,
    });
    return successResponse(
      UserMapper.toResponse(updated!),
      'Profile updated',
    );
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedException(MSG.USER_NOT_FOUND);

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(userId, { password: hashed });
    await this.refreshTokenRepository.revokeAllForUser(userId);
    return successResponse(null, 'Password changed');
  }

  async refresh(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const stored = await this.refreshTokenRepository.findValidByHash(hash);
    if (!stored) {
      throw new UnauthorizedException(
        'Session expired, please sign in again',
      );
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException(MSG.INVALID_CREDENTIALS);
    }

    await this.refreshTokenRepository.revoke(stored.id);
    return this.buildAuthResponse(user);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const hash = this.hashToken(refreshToken);
      const stored = await this.refreshTokenRepository.findValidByHash(hash);
      if (stored && stored.userId === userId) {
        await this.refreshTokenRepository.revoke(stored.id);
      }
    } else {
      await this.refreshTokenRepository.revokeAllForUser(userId);
    }
    return successResponse(null, 'Signed out');
  }

  async makeAdmin(dto: MakeAdminDto) {
    const configuredSecret = this.configService.get<string>('adminSetupSecret');
    if (!configuredSecret) {
      throw new BadRequestException(MSG.ADMIN_SETUP_DISABLED);
    }
    if (dto.secret !== configuredSecret) {
      throw new UnauthorizedException(MSG.ADMIN_SETUP_INVALID);
    }

    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      if (!dto.password || !dto.fullName) {
        throw new BadRequestException(MSG.ADMIN_SETUP_NEED_PROFILE);
      }

      const hashed = await bcrypt.hash(dto.password, 10);
      const created = await this.userRepository.create({
        id: randomUUID(),
        email: dto.email,
        password: hashed,
        fullName: dto.fullName,
        role: UserRole.ADMIN,
      });
      return successResponse(
        UserMapper.toResponse(created),
        MSG.ADMIN_CREATED,
      );
    }
    if (user.role === UserRole.ADMIN) {
      return successResponse(UserMapper.toResponse(user), MSG.ADMIN_GRANTED);
    }

    const updated = await this.userRepository.update(user.id, {
      role: UserRole.ADMIN,
    });
    return successResponse(UserMapper.toResponse(updated!), MSG.ADMIN_GRANTED);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseAccessExpires(value: string): number {
    const m = value.match(/^(\d+)([smhd])$/);
    if (!m) return 900;
    const n = parseInt(m[1], 10);
    const unit = m[2];
    if (unit === 's') return n;
    if (unit === 'm') return n * 60;
    if (unit === 'h') return n * 3600;
    return n * 86400;
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    role?: string;
    fullName?: string;
    phone?: string | null;
    avatar?: string | null;
    isActive?: boolean;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role ?? UserRole.CUSTOMER,
    };
    const accessExpiresSec = this.parseAccessExpires(
      this.configService.get<string>('jwt.accessExpiresIn') ?? '15m',
    );
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiresSec,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const refreshDays =
      this.configService.get<number>('jwt.refreshExpiresDays') ?? 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    await this.refreshTokenRepository.create({
      id: randomUUID(),
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
    });

    return successResponse(
      {
        accessToken,
        refreshToken,
        user: UserMapper.toResponse(
          user as Parameters<typeof UserMapper.toResponse>[0],
        ),
      },
      MSG.AUTHENTICATED,
    );
  }
}
