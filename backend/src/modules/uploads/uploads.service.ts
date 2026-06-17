import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from '../../integrations/cloudinary/cloudinary.service';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly cloudinary: CloudinaryService,
    private readonly config: ConfigService,
  ) {}

  private assertCloudinaryConfig(): void {
    const configured = Boolean(
      this.config.get<string>('cloudinary.cloudName') &&
        this.config.get<string>('cloudinary.apiKey') &&
        this.config.get<string>('cloudinary.apiSecret'),
    );
    if (!configured) {
      throw new InternalServerErrorException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }
  }

  async uploadImage(buffer: Buffer): Promise<{ imageUrl: string }> {
    this.assertCloudinaryConfig();
    try {
      const imageUrl = await this.cloudinary.uploadBuffer(buffer);
      return { imageUrl };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Cloudinary upload failed';
      this.logger.error(`Cloudinary upload failed: ${message}`);
      throw new InternalServerErrorException('Unable to upload image to Cloudinary');
    }
  }
}
