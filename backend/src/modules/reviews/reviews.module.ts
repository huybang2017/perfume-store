import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { ReviewController } from './controllers/review.controller';
import { ReviewRepository } from './repositories/review.repository';
import { ReviewService } from './services/review.service';

@Module({
  imports: [ProductsModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository],
})
export class ReviewsModule {}
