'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { useGetCartQuery } from '@/store/api/cartApi';
import { useValidateVoucherMutation } from '@/store/api/voucherApi';
import {
  useCheckoutPaymentMutation,
  type PaymentMethod,
} from '@/store/api/paymentApi';
import { useAuth } from '@/hooks/useAuth';
import { formatVND, vi } from '@/lib/i18n';
import { VariantLineDetails } from '@/features/product/components/VariantLineDetails';
import { ROUTES } from '@/constants/routes';
import { PaymentMethodSelector } from '@/features/payment/components/PaymentMethodSelector';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Invalid phone number'),
  street: z.string().min(3, 'Please enter street address'),
  ward: z.string().min(2, 'Please enter ward'),
  district: z.string().min(2, 'Please enter district'),
  province: z.string().min(2, 'Please enter province or city'),
  note: z.string().optional(),
  voucherCode: z.string().optional(),
  shippingFee: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

export function CheckoutForm() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: cartData } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [checkoutPayment, { isLoading }] = useCheckoutPaymentMutation();
  const [validateVoucher] = useValidateVoucherMutation();
  const [discount, setDiscount] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [appliedVoucher, setAppliedVoucher] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      fullName: '',
      phone: '',
      street: '',
      ward: '',
      district: '',
      province: '',
      shippingFee: 30000,
    },
  });

  const subtotal = cartData?.data?.subtotal ?? 0;
  const shippingFee = watch('shippingFee') || 0;
  const total = subtotal - discount + shippingFee;
  const cartItems = cartData?.data?.items ?? [];

  const applyVoucher = async () => {
    const code = watch('voucherCode');
    if (!code || subtotal <= 0) return;
    try {
      const res = await validateVoucher({ code, orderAmount: subtotal }).unwrap();
      if (res.success) {
        setDiscount(res.data.discount);
        setAppliedVoucher(code);
        setVoucherMessage(`${vi.checkout.discountApplied}: ${formatVND(res.data.discount)}`);
      }
    } catch {
      setDiscount(0);
      setAppliedVoucher(undefined);
      setVoucherMessage(vi.checkout.invalidVoucher);
    }
  };

  const clearVoucher = () => {
    setDiscount(0);
    setAppliedVoucher(undefined);
    setVoucherMessage('');
  };

  const onSubmit = async (raw: FormData) => {
    const parsed = schema.safeParse({
      ...raw,
      shippingFee: Number(raw.shippingFee) || 0,
    });
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormData;
        if (field) setError(field, { message: issue.message });
      });
      return;
    }
    const data = parsed.data;
    try {
      const res = await checkoutPayment({
        paymentMethod,
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          street: data.street,
          ward: data.ward,
          district: data.district,
          province: data.province,
          address: `${data.street}, ${data.ward}, ${data.district}, ${data.province}`,
          city: data.province,
        },
        note: data.note,
        voucherCode: appliedVoucher,
        shippingFee: data.shippingFee,
      }).unwrap();

      if (!res.success) return;

      const { order, redirectUrl, bankTransfer } = res.data;

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      if (paymentMethod === 'BANK_TRANSFER' && bankTransfer) {
        sessionStorage.setItem(
          `bankTransfer:${order.id}`,
          JSON.stringify(bankTransfer),
        );
      }

      router.push(ROUTES.account.order(order.id));
    } catch {
      /* lỗi từ API */
    }
  };

  if (!isAuthenticated) {
    return (
      <p className="text-center text-slate-600">
        <Link href={ROUTES.auth.login} className="font-medium text-blue-600 hover:underline">
          {vi.common.signIn}
        </Link>{' '}
        {vi.checkout.signInToCheckout}
      </p>
    );
  }

  if (!cartItems.length) {
    return (
      <p className="text-center text-slate-600">
        {vi.checkout.cartEmpty}{' '}
        <Link href={ROUTES.shop} className="font-medium text-blue-600 hover:underline">
          {vi.checkout.shopNow}
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{vi.checkout.shipping}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label={vi.auth.fullName} error={errors.fullName?.message}>
              <Input error={!!errors.fullName} {...register('fullName')} />
            </FormField>
            <FormField label={vi.checkout.phone} error={errors.phone?.message}>
              <Input error={!!errors.phone} {...register('phone')} />
            </FormField>
            <FormField label={vi.checkout.street} error={errors.street?.message}>
              <Input placeholder="123 Main Street" error={!!errors.street} {...register('street')} />
            </FormField>
            <FormField label={vi.checkout.ward} error={errors.ward?.message}>
              <Input placeholder="Ward 1" error={!!errors.ward} {...register('ward')} />
            </FormField>
            <FormField label={vi.checkout.district} error={errors.district?.message}>
              <Input placeholder="District 1" error={!!errors.district} {...register('district')} />
            </FormField>
            <FormField label={vi.checkout.province} error={errors.province?.message}>
              <Input placeholder="Ho Chi Minh City" error={!!errors.province} {...register('province')} />
            </FormField>
            <FormField label={vi.checkout.note}>
              <Input {...register('note')} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{vi.payment.selectMethod}</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>{vi.checkout.orderSummary}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="max-h-48 space-y-2 overflow-y-auto border-b border-slate-100 pb-4">
            {cartItems.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">
                    {item.product.name} × {item.quantity}
                  </p>
                  <VariantLineDetails
                    variantOptions={item.variantOptions}
                    sku={item.sku}
                    className="mt-0.5 text-xs"
                  />
                </div>
                <span className="shrink-0 font-medium text-slate-900">
                  {formatVND(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{vi.checkout.subtotal}</span>
            <span className="font-medium">{formatVND(subtotal)}</span>
          </div>

          <div className="flex gap-2">
            <Input placeholder={vi.checkout.voucherCode} className="flex-1" {...register('voucherCode')} />
            <Button type="button" variant="outline" onClick={applyVoucher}>
              {vi.checkout.apply}
            </Button>
            {discount > 0 && (
              <Button type="button" variant="ghost" onClick={clearVoucher}>
                {vi.payment.removeVoucher}
              </Button>
            )}
          </div>
          {voucherMessage && (
            <p
              className={`text-sm ${voucherMessage.includes(vi.checkout.invalidVoucher) ? 'text-red-600' : 'text-green-600'}`}
            >
              {voucherMessage}
            </p>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{vi.checkout.discount}</span>
              <span>-{formatVND(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{vi.checkout.shippingFee}</span>
            <span className="font-medium">{formatVND(shippingFee)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-semibold">
            <span>{vi.checkout.total}</span>
            <span>{formatVND(total)}</span>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? vi.checkout.placingOrder : vi.checkout.placeOrder}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
