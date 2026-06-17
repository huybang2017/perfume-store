import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { sortObject } from './gateway.utils';

@Injectable()
export class VnpayGateway {
  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!(
      this.config.get<string>('payment.vnpay.tmnCode') &&
      this.config.get<string>('payment.vnpay.hashSecret')
    );
  }

  createPaymentUrl(params: {
    amount: number;
    orderId: string;
    orderInfo: string;
    ipAddr: string;
    txnRef: string;
  }): string {
    const tmnCode = this.config.get<string>('payment.vnpay.tmnCode')!;
    const hashSecret = this.config.get<string>('payment.vnpay.hashSecret')!;
    const vnpUrl = this.config.get<string>('payment.vnpay.url')!;
    const returnUrl = this.config.get<string>('payment.vnpay.returnUrl')!;

    const date = new Date();
    const createDate = this.formatDate(date);
    const expireDate = this.formatDate(
      new Date(date.getTime() + 15 * 60 * 1000),
    );

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(Math.round(params.amount * 100)),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.txnRef,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: params.ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    const sorted = sortObject(vnpParams);
    const signData = new URLSearchParams(sorted).toString();
    const secureHash = crypto
      .createHmac('sha512', hashSecret)
      .update(signData)
      .digest('hex');

    return `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
  }

  verifyCallback(query: Record<string, string>): {
    valid: boolean;
    success: boolean;
    txnRef: string;
    amount: number;
    responseCode: string;
  } {
    const hashSecret = this.config.get<string>('payment.vnpay.hashSecret');
    if (!hashSecret) {
      return {
        valid: false,
        success: false,
        txnRef: query.vnp_TxnRef ?? '',
        amount: 0,
        responseCode: '99',
      };
    }

    const secureHash = query.vnp_SecureHash;
    const params = { ...query };
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const sorted = sortObject(params);
    const signData = new URLSearchParams(sorted).toString();
    const checkHash = crypto
      .createHmac('sha512', hashSecret)
      .update(signData)
      .digest('hex');

    const valid = secureHash === checkHash;
    const responseCode = query.vnp_ResponseCode ?? '99';
    const success = valid && responseCode === '00';

    return {
      valid,
      success,
      txnRef: query.vnp_TxnRef ?? '',
      amount: Number(query.vnp_Amount ?? 0) / 100,
      responseCode,
    };
  }

  private formatDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
      `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
    );
  }
}
