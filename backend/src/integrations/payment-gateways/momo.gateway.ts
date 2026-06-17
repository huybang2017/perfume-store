import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class MomoGateway {
  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!(
      this.config.get<string>('payment.momo.partnerCode') &&
      this.config.get<string>('payment.momo.secretKey')
    );
  }

  async createPaymentRequest(params: {
    amount: number;
    orderId: string;
    orderInfo: string;
    requestId: string;
  }): Promise<{ payUrl: string; raw: Record<string, unknown> }> {
    const partnerCode = this.config.get<string>('payment.momo.partnerCode')!;
    const accessKey = this.config.get<string>('payment.momo.accessKey')!;
    const secretKey = this.config.get<string>('payment.momo.secretKey')!;
    const endpoint = this.config.get<string>('payment.momo.endpoint')!;
    const returnUrl = this.config.get<string>('payment.momo.returnUrl')!;
    const ipnUrl = this.config.get<string>('payment.momo.ipnUrl')!;

    const requestType = 'captureWallet';
    const extraData = '';
    const orderInfo = params.orderInfo;
    const redirectUrl = returnUrl;
    const ipnUrlVal = ipnUrl;
    const amount = String(params.amount);
    const orderId = params.orderId;
    const requestId = params.requestId;
    const lang = 'vi';

    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrlVal}&orderId=${orderId}&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const body = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl: ipnUrlVal,
      extraData,
      requestType,
      signature,
      lang,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      payUrl?: string;
      resultCode?: number;
      message?: string;
    };

    if (!json.payUrl) {
      throw new Error(json.message ?? 'MoMo create payment failed');
    }

    return { payUrl: json.payUrl, raw: json };
  }

  verifyIpn(body: Record<string, string>): {
    valid: boolean;
    success: boolean;
    orderId: string;
    amount: number;
  } {
    const secretKey = this.config.get<string>('payment.momo.secretKey');
    if (!secretKey) {
      return { valid: false, success: false, orderId: '', amount: 0 };
    }

    const signature = body.signature;
    const rawSignature =
      `accessKey=${body.accessKey}&amount=${body.amount}&extraData=${body.extraData}` +
      `&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}` +
      `&orderType=${body.orderType}&partnerCode=${body.partnerCode}` +
      `&payType=${body.payType}&requestId=${body.requestId}` +
      `&responseTime=${body.responseTime}&resultCode=${body.resultCode}` +
      `&transId=${body.transId}`;

    const check = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const valid = signature === check;
    const success = valid && body.resultCode === '0';

    return {
      valid,
      success,
      orderId: body.orderId ?? '',
      amount: Number(body.amount ?? 0),
    };
  }
}
