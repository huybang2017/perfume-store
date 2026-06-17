export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL,
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    /** @deprecated use accessExpiresIn */
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresDays: parseInt(
      process.env.JWT_REFRESH_EXPIRES_DAYS ?? '30',
      10,
    ),
  },
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
    authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT ?? '10', 10),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  payment: {
    bankName: process.env.BANK_NAME ?? 'Vietcombank',
    bankAccount: process.env.BANK_ACCOUNT ?? '0123456789',
    bankHolder: process.env.BANK_HOLDER ?? 'CONG TY TNHH CLOTHIFY',
    vnpay: {
      tmnCode: process.env.VNPAY_TMN_CODE ?? '',
      hashSecret: process.env.VNPAY_HASH_SECRET ?? '',
      url:
        process.env.VNPAY_URL ??
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl:
        process.env.VNPAY_RETURN_URL ??
        'http://localhost:3000/thanh-toan/ket-qua',
      ipnUrl:
        process.env.VNPAY_IPN_URL ??
        'http://localhost:4000/api/v1/payments/vnpay/ipn',
    },
    momo: {
      partnerCode: process.env.MOMO_PARTNER_CODE ?? '',
      accessKey: process.env.MOMO_ACCESS_KEY ?? '',
      secretKey: process.env.MOMO_SECRET_KEY ?? '',
      endpoint:
        process.env.MOMO_ENDPOINT ??
        'https://test-payment.momo.vn/v2/gateway/api/create',
      returnUrl:
        process.env.MOMO_RETURN_URL ??
        'http://localhost:3000/thanh-toan/ket-qua',
      ipnUrl:
        process.env.MOMO_IPN_URL ??
        'http://localhost:4000/api/v1/payments/momo/ipn',
    },
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? 'noreply@clothingstore.com',
  },
  adminSetupSecret: process.env.ADMIN_SETUP_SECRET,
});
