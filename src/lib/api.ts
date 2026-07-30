import { API_BASE_URL } from "./config";
const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

function withAbsoluteAssets<T>(value: T): T {
  if (typeof value === "string" && value.startsWith("/uploads/")) return `${API_ORIGIN}${value}` as T;
  if (Array.isArray(value)) return value.map(withAbsoluteAssets) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, withAbsoluteAssets(item)])) as T;
  }
  return value;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const hasBody = options.body !== undefined && options.body !== null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return withAbsoluteAssets(data as T);
}

export type WebsiteProduct = {
  id: number | string;
  name: string;
  slug?: string;
  category: string;
  goal: string;
  flavor: string;
  badge: string;
  price: number;
  stock: number;
  inStock?: boolean;
  rating: number;
  image: string;
  imageUrl?: string;
  images?: string[];
  description?: string;
  tagline?: string;
  material?: string;
  purity?: string;
  weight?: string;
  relatedProductIds?: string[];
  reviews?: Array<{ name: string; rating: number; text: string }>;
  reviewCount?: number;
  comparePrice?: number;
  isFeatured?: boolean;
};
export type WebsiteCategory = { id: number; name: string; slug: string; imageUrl: string; productCount: number };

export type WebsiteTestimonial = {
  id: number | string;
  name: string;
  role?: string;
  rating: number;
  text: string;
  imageUrl?: string;
  source?: string;
  sourceId?: string;
  authorMeta?: string;
  reviewDate?: string;
  isVisible?: boolean;
  createdAt?: string;
};

export type WebsiteGalleryItem = {
  id: number | string;
  title: string;
  category: string;
  mediaType: "image" | "video" | "tour";
  imageUrl: string;
  videoUrl?: string;
  description?: string;
  sortOrder?: number;
  isVisible?: boolean;
};

export type WebsiteBlog = {
  id: number | string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string;
  imageUrl?: string;
  image?: string;
  status?: "Draft" | "Published";
  isFeatured?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type WebsiteUser = {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  plan?: string;
  address?: string;
  token?: string;
};

export type WebsiteAddress = {
  id: number;
  label: string;
  address: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type WebsiteOrder = {
  id: number | string;
  orderId: string;
  product: string;
  category?: string;
  amount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentTransactionId?: string;
  deliveryMode?: string;
  deliveryAddress?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items?: Array<{ id: number; productId: number | null; productName: string; sku?: string; unitPrice: number; quantity: number; lineTotal: number; productSnapshot?: { image?: string } }>;
};

export type PhonePeInitResponse = {
  order: WebsiteOrder;
  merchantTransactionId: string;
  redirectUrl: string;
};

export type CouponValidation = {
  valid: boolean;
  message: string;
  discount: number;
  coupon?: {
    id: number | string;
    code: string;
    title: string;
    discountType: "percentage" | "flat";
    discountValue: number;
  };
};

export const websiteApi = {
  contentBlock: (key: string) =>
    request<{ key: string; title: string; body: string; isActive: boolean }>(
      `/content-blocks/${encodeURIComponent(key)}`,
    ),
  products: (params = "page=1&limit=100") => request<{ products: WebsiteProduct[]; total: number; currentPage: number; totalPages: number }>(`/products?${params}`),
  product: (idOrSlug: string | number) => request<WebsiteProduct>(`/products/${encodeURIComponent(idOrSlug)}`),
  categories: () => request<{ categories: WebsiteCategory[] }>("/categories"),
  gallery: () => request<{ galleryItems: WebsiteGalleryItem[] }>("/gallery"),
  blogs: (params = "page=1&limit=60") =>
    request<{
      blogs: WebsiteBlog[];
      categories: Array<{ category: string; total: number }>;
      total: number;
      currentPage: number;
      totalPages: number;
    }>(`/blogs?${params}`),
  blog: (slug: string) =>
    request<{ blog: WebsiteBlog; related: WebsiteBlog[] }>(`/blogs/${encodeURIComponent(slug)}`),
  createOrder: (payload: unknown) =>
    request<{ id: number; orderId: string; invoiceNumber: string }>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createPhonePePayment: (payload: unknown) =>
    request<PhonePeInitResponse>("/payments/phonepe/initiate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  phonePeStatus: (transactionId: string) =>
    request<{ order: WebsiteOrder; paymentStatus: string }>(
      `/payments/phonepe/status/${encodeURIComponent(transactionId)}`,
    ),
  validateCoupon: (payload: unknown) =>
    request<CouponValidation>("/coupons/validate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createEnquiry: (payload: unknown) =>
    request<{ id: number; status: string }>("/enquiries", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  testimonials: (params = "page=1&limit=24") =>
    request<{
      testimonials: WebsiteTestimonial[];
      total: number;
      stats?: { total: number; average: number; distribution: Record<1 | 2 | 3 | 4 | 5, number> };
      currentPage: number;
      totalPages: number;
    }>(`/testimonials?${params}`),
  createTestimonial: (payload: unknown) =>
    request<WebsiteTestimonial>("/testimonials", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: unknown) =>
    request<WebsiteUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload: unknown) =>
    request<WebsiteUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  requestOtp: (payload: unknown) =>
    request<{ message: string; otpSent: boolean; devOtp?: string }>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyOtp: (payload: unknown) =>
    request<WebsiteUser>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload: unknown) =>
    request<{ message: string; otpSent: boolean; devOtp?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload: unknown) =>
    request<WebsiteUser>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
  profile: () => request<WebsiteUser>("/me"),
  updateProfile: (payload: unknown) =>
    request<WebsiteUser>("/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  addresses: () => request<{ addresses: WebsiteAddress[] }>("/me/addresses"),
  createAddress: (payload: unknown) =>
    request<WebsiteAddress>("/me/addresses", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAddress: (id: string | number, payload: unknown) =>
    request<WebsiteAddress>(`/me/addresses/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteAddress: (id: string | number) =>
    request<{ message: string }>(`/me/addresses/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  changePassword: (payload: unknown) =>
    request<{ message: string }>("/me/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  myOrders: (params = "page=1&limit=20") =>
    request<{ orders: WebsiteOrder[]; total: number; currentPage: number; totalPages: number }>(`/me/orders?${params}`),
  orderDetails: (id: string | number) => request<WebsiteOrder>(`/me/orders/${id}`),
  wishlist: () => request<{ products: WebsiteProduct[] }>("/me/wishlist"),
  addWishlist: (productId: string | number) =>
    request<{ message: string; productId: string | number }>("/me/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),
  removeWishlist: (productId: string | number) =>
    request<{ message: string }>(`/me/wishlist/${productId}`, { method: "DELETE" }),
};
