import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';
import { CLOUDINARY } from './cloudinary.constants';

@Global()
@Module({
  providers: [
    {
      provide: CLOUDINARY,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        cloudinary.config({
          cloud_name: config.get('cloudinary.cloudName'),
          api_key: config.get('cloudinary.apiKey'),
          api_secret: config.get('cloudinary.apiSecret'),
        });
        return cloudinary;
      },
    },
    CloudinaryService,
  ],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
