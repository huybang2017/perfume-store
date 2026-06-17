/**
 * End-to-end API smoke test — run: npm run test:api
 * Requires backend at http://localhost:4000 with seeded DB + variant migration.
 */

const BASE = process.env.API_URL ?? 'http://localhost:4000/api/v1';

const results = [];
let adminToken = '';
let customerToken = '';
let customerRefreshToken = '';
let productId = '';
let variantId = '';
let productSlug = '';
let categoryId = '';
let cartItemId = '';
let orderId = '';
let paymentId = '';
let conversationId = '';
let voucherId = '';
let reviewId = '';
let notificationId = '';

const customerEmail = `test-${Date.now()}@example.com`;
const customerPassword = 'TestPass123';

const shippingAddress = {
  fullName: 'Nguyễn Văn Test',
  phone: '0901234567',
  street: '123 Nguyễn Huệ',
  ward: 'Phường Bến Nghé',
  district: 'Quận 1',
  province: 'Thành phố Hồ Chí Minh',
  address: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1',
  city: 'Thành phố Hồ Chí Minh',
};

async function req(method, path, { body, token, expectStatus, label } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  const ok =
    expectStatus != null
      ? res.status === expectStatus
      : res.ok && json?.success !== false;

  const name = label ?? `${method} ${path}`;
  results.push({
    name,
    status: res.status,
    ok,
    message: json?.message ?? res.statusText,
    error: !ok ? JSON.stringify(json)?.slice(0, 200) : undefined,
  });

  if (!ok) {
    console.error(`FAIL ${name} → ${res.status}`, json);
  } else {
    console.log(`OK   ${name}`);
  }

  return { res, json, ok };
}

async function main() {
  console.log(`Testing ${BASE}\n`);

  await req('GET', '/health');
  let r = await req('GET', '/products?page=1&limit=5');
  productId = r.json?.data?.[0]?.id ?? '';
  productSlug = r.json?.data?.[0]?.slug ?? '';

  if (productId) {
    r = await req('GET', `/products/${productId}`);
    variantId = r.json?.data?.variants?.[0]?.id ?? '';
  }

  await req('GET', '/products?isFeatured=true&limit=5', {
    label: 'GET /products?isFeatured=true',
  });

  if (productSlug) await req('GET', `/products/slug/${productSlug}`);

  await req('GET', '/products/filter-options', {
    label: 'GET /products/filter-options',
  });

  r = await req('GET', '/categories?page=1');
  categoryId = r.json?.data?.[0]?.id ?? '';
  if (categoryId) await req('GET', `/categories/${categoryId}`);

  await req('GET', '/brands?page=1');

  if (productId) {
    await req('GET', `/reviews/product/${productId}?page=1`);
  }

  await req('POST', '/vouchers/validate', {
    body: { code: 'SAVE10', orderAmount: 600000 },
    label: 'POST /vouchers/validate (VND — valid amount)',
  });

  await req('POST', '/vouchers/validate', {
    body: { code: 'SAVE10', orderAmount: 100000 },
    expectStatus: 400,
    label: 'POST /vouchers/validate (below min order — expect 400)',
  });

  await req('GET', '/settings/public/store_name');

  r = await req('POST', '/auth/login', {
    body: { email: 'admin@clothingstore.com', password: 'Admin@123' },
  });
  adminToken = r.json?.data?.accessToken ?? '';

  await req('POST', '/auth/register', {
    body: { email: customerEmail, password: 'short', fullName: 'Bad' },
    expectStatus: 400,
    label: 'POST /auth/register (short password — expect 400)',
  });

  r = await req('POST', '/auth/register', {
    body: {
      email: customerEmail,
      password: customerPassword,
      fullName: 'API Test User',
    },
  });
  customerToken = r.json?.data?.accessToken ?? '';
  customerRefreshToken = r.json?.data?.refreshToken ?? '';

  await req('PATCH', '/auth/profile', {
    token: customerToken,
    body: { fullName: 'API Test User Updated', phone: '0909999888' },
    label: 'PATCH /auth/profile',
  });

  r = await req('GET', '/account/addresses', { token: customerToken });
  const addressId = r.json?.data?.[0]?.id;

  if (!addressId) {
    r = await req('POST', '/account/addresses', {
      token: customerToken,
      body: {
        label: 'Nhà',
        fullName: 'Nguyễn Văn Test',
        phone: '0901234567',
        province: 'Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        street: '123 Nguyễn Huệ',
        isDefault: true,
      },
      label: 'POST /account/addresses',
    });
  }

  if (customerRefreshToken) {
    r = await req('POST', '/auth/refresh', {
      body: { refreshToken: customerRefreshToken },
      label: 'POST /auth/refresh',
    });
    customerToken = r.json?.data?.accessToken ?? customerToken;
    customerRefreshToken = r.json?.data?.refreshToken ?? customerRefreshToken;
  }

  await req('GET', '/auth/profile', { token: customerToken });
  await req('GET', '/auth/profile', { token: adminToken });

  await req('GET', '/auth/profile', {
    token: 'invalid.token.here',
    expectStatus: 401,
    label: 'GET /auth/profile (invalid token — expect 401)',
  });

  await req('GET', '/carts', { token: customerToken });
  await req('DELETE', '/carts', { token: customerToken });

  if (productId && variantId) {
    r = await req('POST', '/carts/items', {
      token: customerToken,
      body: { productId, variantId, quantity: 2 },
      label: 'POST /carts/items (with variantId)',
    });
    cartItemId = r.json?.data?.items?.[0]?.id ?? '';

    if (cartItemId) {
      await req('PATCH', `/carts/items/${cartItemId}`, {
        token: customerToken,
        body: { quantity: 3 },
        label: 'PATCH /carts/items/:id',
      });
    }
  }

  r = await req('POST', '/payments/checkout', {
    token: customerToken,
    body: {
      paymentMethod: 'COD',
      shippingAddress,
      voucherCode: 'SAVE10',
      shippingFee: 30000,
    },
    label: 'POST /payments/checkout (COD)',
  });
  orderId = r.json?.data?.order?.id ?? r.json?.data?.id ?? '';
  paymentId = r.json?.data?.payment?.id ?? '';

  await req('GET', '/orders/my-stats', { token: customerToken });
  await req('GET', '/orders/my-orders?page=1', { token: customerToken });
  await req('GET', '/orders', { token: customerToken });

  if (orderId) {
    await req('GET', `/orders/${orderId}`, { token: customerToken });
    await req('GET', `/payments/order/${orderId}`, {
      token: customerToken,
      label: 'GET /payments/order/:orderId',
    });
  }

  await req('GET', '/payments', { token: adminToken });

  if (productId && variantId) {
    await req('DELETE', '/carts', { token: customerToken });
    await req('POST', '/carts/items', {
      token: customerToken,
      body: { productId, variantId, quantity: 1 },
    });
    r = await req('POST', '/orders/checkout', {
      token: customerToken,
      body: {
        shippingAddress,
        shippingFee: 0,
      },
      label: 'POST /orders/checkout (legacy)',
    });
    const cancelOrderId = r.json?.data?.id;
    if (cancelOrderId) {
      await req('PATCH', `/orders/${cancelOrderId}/cancel`, {
        token: customerToken,
        body: { reason: 'Đổi ý không muốn mua nữa' },
        label: 'PATCH /orders/:id/cancel',
      });
    }
  }

  if (orderId) {
    await req('POST', `/orders/${orderId}/reorder`, {
      token: customerToken,
      label: 'POST /orders/:id/reorder',
    });
  }

  if (productId) {
    r = await req('POST', '/reviews', {
      token: customerToken,
      body: { productId, rating: 5, comment: 'Sản phẩm tốt' },
    });
    reviewId = r.json?.data?.id ?? '';
    if (reviewId) {
      await req('DELETE', `/reviews/${reviewId}`, { token: adminToken });
    }
  }

  r = await req('POST', '/chat/conversations/start', { token: customerToken });
  conversationId = r.json?.data?.id ?? '';
  if (conversationId) {
    await req('GET', `/chat/conversations/${conversationId}/messages`, {
      token: customerToken,
    });
    await req('POST', '/chat/messages', {
      token: customerToken,
      body: { conversationId, content: 'Xin chào từ API test' },
    });
  }

  const profile = await req('GET', '/auth/profile', { token: customerToken });
  const customerUserId = profile.json?.data?.id ?? '';

  await req('GET', '/notifications?page=1', { token: customerToken });

  if (customerUserId) {
    await req('POST', '/notifications', {
      token: adminToken,
      body: {
        userId: customerUserId,
        title: 'Thông báo test',
        body: 'Nội dung thông báo API',
      },
    });
  }

  r = await req('GET', '/notifications?page=1', { token: customerToken });
  notificationId = r.json?.data?.[0]?.id ?? '';
  if (notificationId) {
    await req('PATCH', `/notifications/${notificationId}/read`, {
      token: customerToken,
    });
  }

  await req('GET', '/dashboard/stats', { token: adminToken });
  await req('GET', '/users?page=1', { token: adminToken });
  await req('GET', '/vouchers?page=1', { token: adminToken });
  await req('GET', '/inventory/low-stock', { token: adminToken });

  if (productId) {
    await req('PATCH', `/inventory/${productId}/stock`, {
      token: adminToken,
      body: { stock: 100 },
      label: 'PATCH /inventory/:productId/stock',
    });
  }

  if (orderId) {
    await req('PATCH', `/orders/${orderId}/status`, {
      token: adminToken,
      body: { status: 'confirmed' },
    });
  }

  await req('GET', '/chat/conversations', { token: adminToken });
  await req('GET', '/chat/unread-count', { token: adminToken });
  await req('GET', '/settings', { token: adminToken });
  await req('PUT', '/settings', {
    token: adminToken,
    body: { key: 'api_test_key', value: 'ok' },
  });

  const slug = `test-cat-${Date.now()}`;
  r = await req('POST', '/categories', {
    token: adminToken,
    body: { name: 'Danh mục test', slug },
  });
  const newCatId = r.json?.data?.id;
  if (newCatId) await req('DELETE', `/categories/${newCatId}`, { token: adminToken });

  await req('POST', '/brands', {
    token: adminToken,
    body: { name: 'Thương hiệu test', slug: `test-brand-${Date.now()}` },
  });

  r = await req('POST', '/vouchers', {
    token: adminToken,
    body: {
      code: `TEST${Date.now()}`,
      type: 'fixed',
      value: 50000,
      isActive: true,
    },
  });
  voucherId = r.json?.data?.id ?? '';
  if (voucherId) await req('DELETE', `/vouchers/${voucherId}`, { token: adminToken });

  await req('DELETE', '/carts', { token: customerToken });

  const failed = results.filter((x) => !x.ok);
  console.log('\n--- Summary ---');
  console.log(
    `Total: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`,
  );
  if (failed.length) {
    console.log('\nFailed endpoints:');
    failed.forEach((f) =>
      console.log(`  ${f.name} [${f.status}] ${f.message} ${f.error ?? ''}`),
    );
    process.exit(1);
  }
  console.log('\nAll API tests passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
