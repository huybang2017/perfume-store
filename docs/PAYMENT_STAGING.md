# Staging: VNPay & MoMo

Hướng dẫn kiểm thử thanh toán với credential sandbox thật.

## 1. Biến môi trường (backend/.env)

```env
FRONTEND_URL=https://your-staging-domain.com

# VNPay Sandbox — lấy từ https://sandbox.vnpayment.vn/
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-staging-domain.com/thanh-toan/ket-qua
VNPAY_IPN_URL=https://your-api-domain.com/api/v1/payments/vnpay/ipn

# MoMo Test — lấy từ https://developers.momo.vn/
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=https://your-staging-domain.com/thanh-toan/ket-qua
MOMO_IPN_URL=https://your-api-domain.com/api/v1/payments/momo/ipn
```

**Lưu ý IPN:** Gateway gọi IPN từ internet. `localhost` không nhận được IPN — dùng ngrok/cloudflare tunnel hoặc deploy staging có URL công khai.

## 2. Luồng kiểm thử

1. Chạy migration & seed: `npm run db:migrate-account --prefix backend`, `npm run db:seed --prefix backend`
2. Đăng nhập khách hàng → thêm sản phẩm (có biến thể) → checkout
3. Chọn **VNPay** hoặc **MoMo** → `POST /payments/checkout`
4. Redirect sang cổng sandbox → thanh toán thẻ test the gateway cung cấp
5. Kiểm tra redirect về `/thanh-toan/ket-qua?...`
6. Admin: `/admin/payments` — trạng thái `paid` sau IPN thành công

## 3. Dev không có credential

Khi `VNPAY_TMN_CODE` / `MOMO_PARTNER_CODE` trống, checkout online trả lỗi cấu hình. Trong **non-production** có thể dùng:

```http
POST /api/v1/payments/demo-confirm/:orderId
Authorization: Bearer <admin_token>
```

để mô phỏng thanh toán thành công (chỉ development).

## 4. Checklist staging

- [ ] Return URL khớp domain frontend staging
- [ ] IPN URL public, HTTPS, trỏ đúng `/api/v1/payments/vnpay/ipn` và `/momo/ipn`
- [ ] Đồng hồ server đúng (VNPay kiểm tra `vnp_CreateDate`)
- [ ] Đơn hàng `pending`, tồn kho đã trừ khi tạo đơn
- [ ] Sau IPN: `payment_status=paid`, email (nếu bật SMTP)

## 5. Thẻ test (tham khảo tài liệu gateway)

- **VNPay sandbox:** dùng thông tin thẻ test trên portal sandbox VNPay.
- **MoMo test:** dùng app ví test / số điện thoại test từ MoMo Developer.

Cập nhật credential theo tài liệu mới nhất của từng cổng.
