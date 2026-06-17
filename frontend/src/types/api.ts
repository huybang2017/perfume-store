export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'staff' | 'customer';
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  weight?: number | null;
  isActive: boolean;
  options: Record<string, string>;
  imageUrl?: string | null;
  imageUrls: string[];
}

export interface ProductOption {
  id: string;
  name: string;
  sortOrder: number;
  values: { id: string; value: string; sortOrder: number }[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  priceMin?: number;
  priceMax?: number;
  comparePrice?: number | null;
  sku?: string;
  images: string[];
  thumbnailUrl?: string | null;
  updatedAt?: string;
  categoryId?: string;
  brandId?: string;
  stock: number;
  isFeatured?: boolean;
  isActive: boolean;
  status?: 'draft' | 'active' | 'out_of_stock' | 'archived';
  hasVariants?: boolean;
  variants?: ProductVariant[];
  options?: ProductOption[];
  availableColors?: string[];
  availableSizes?: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface UserAddress {
  id: string;
  label?: string | null;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variantOptions?: Record<string, string>;
  sku?: string;
  product: {
    name: string;
    slug: string;
    image: string | null;
    stock: number;
    isActive: boolean;
  };
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  variantName?: string | null;
  productName: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string | null;
  variant?: string;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  createdAt: string;
  note?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  shippingAddress?: Record<string, string>;
  note?: string | null;
  voucherCode?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  cancelReason?: string | null;
  itemCount?: number;
  items?: OrderItem[];
  statusHistory?: OrderStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  total: number;
  processing: number;
  shipping: number;
  completed: number;
  cancelled: number;
}

export interface ReorderResult {
  added: string[];
  skipped: { productId: string; productName: string; reason: string }[];
  addedCount: number;
}

export interface Voucher {
  id: string;
  code: string;
  description?: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  isActive?: boolean;
}

export interface Setting {
  id: string;
  key: string;
  value: string | null;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType?: 'CUSTOMER' | 'ADMIN';
  senderRole: 'customer' | 'admin' | 'staff';
  content?: string | null;
  imageUrl?: string | null;
  productId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  customerId?: string | null;
  guestId?: string | null;
  assignedStaffId?: string | null;
  status: 'open' | 'closed';
  lastMessageAt?: string | null;
  createdAt: string;
  customerName?: string | null;
  customerEmail?: string | null;
  lastMessage?: string | null;
  unreadCount?: number;
}

export interface VoucherValidation {
  code: string;
  type: 'percentage' | 'fixed';
  discount: number;
  finalAmount: number;
}
