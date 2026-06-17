import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { STRIPE_CLIENT } from './stripe.constants';

@Global()
@Module({
  providers: [
    {
      provide: STRIPE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const key = config.get<string>('stripe.secretKey');
        return key ? new Stripe(key) : null;
      },
    },
    StripeService,
  ],
  exports: [StripeService],
})
export class StripeModule {}
