import { Inject, Injectable } from '@nestjs/common';
import { v2 as CloudinarySDK } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.constants';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: typeof CloudinarySDK,
  ) {}

  async uploadBuffer(buffer: Buffer, folder = 'clothing-store/variants') {
    return new Promise<string>((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        },
      );
      stream.end(buffer);
    });
  }
}
