import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_CLIENT } from './stripe.constants';

@Injectable()
export class StripeService {
  constructor(
    @Inject(STRIPE_CLIENT)
    private readonly stripe: import('stripe').Stripe | null,
  ) {}

  isConfigured() {
    return !!this.stripe;
  }

  async createPaymentIntent(amount: number, currency = 'usd') {
    if (!this.stripe) throw new Error('Stripe is not configured');
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
    });
  }
}
