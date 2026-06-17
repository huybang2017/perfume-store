import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../../integrations/cloudinary/cloudinary.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
