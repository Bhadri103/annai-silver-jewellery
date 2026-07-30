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

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const hasBody = options.body !== undefined && options.body !== null;
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new AdminApiError("Unable to reach the admin service. Check your connection and try again.", 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const isAdminAuthentication = [
      "/admin/login",
      "/admin/otp/verify",
      "/admin/password-reset/confirm",
    ].includes(path);
    if (response.status === 401 && !isAdminAuthentication) {
      window.dispatchEvent(new CustomEvent("annai-admin-session-expired"));
    }
    throw new AdminApiError(data.message || "Admin request failed", response.status);
  }
  return withAbsoluteAssets(data as T);
}

const json = (method: string, payload?: unknown): RequestInit => ({
  method,
  body: payload === undefined ? undefined : JSON.stringify(payload),
});

export type AdminProfile = { id: number; name: string; username?: string; email: string; role: string };
export type AdminCategory = { id: number; name: string; imageUrl?: string; createdAt?: string; productCount?: number; visibleProductCount?: number };
export type AdminProduct = {
  id: number; name: string; slug: string; category: string; brand: string; badge: string;
  price: number; comparePrice: number; stock: number; rating: number; reviewCount: number;
  image: string; imageUrl: string; images: string[]; description: string; tagline: string;
  isActive: boolean; isFeatured: boolean; inStock: boolean; relatedProductIds: string[];
  variants?: Array<{ id: string; label?: string; sku?: string; price: number; originalPrice?: number; stock: number }>;
  features?: unknown[];
  faqs?: unknown[];
  specs?: Record<string, unknown>;
};
export type AdminOrder = {
  id: number; orderId: string; product: string; category: string; amount: number; status: string;
  paymentStatus: string; paymentMethod: string; paymentProofUrl?: string; deliveryAddress: string;
  invoiceNumber: string; notes: string; customerName: string; customerEmail: string;
  customerPhone: string; createdAt: string;
  items?: Array<{ id: number; productId: number | null; productName: string; sku: string; unitPrice: number; quantity: number; lineTotal: number; productSnapshot?: { image?: string } }>;
};
export type AdminReview = {
  id: number; name: string; role: string; rating: number; text: string; imageUrl?: string;
  productId?: number | null; source?: string; reviewDate?: string; isVisible: boolean; createdAt?: string;
};
export type ContentBlock = {
  id?: number; block_key: string; title: string; body: string; isActive: boolean;
};
export type HomeBanner = {
  id: string; title: string; accent: string; text: string;
  imageUrl: string; mobileImageUrl?: string; position: string;
  primaryLabel: string; primaryLink: string;
  secondaryLabel: string; secondaryLink: string;
  isActive: boolean;
};
export type AdminUser = {
  id: number; name: string; email: string; phone: string; address: string;
  isActive: boolean; orderCount: number; totalSpent: number; createdAt: string;
};
export type AdminCoupon = {
  id: number; code: string; title: string; discountType: "percentage" | "flat";
  discountValue: number; minOrderAmount: number; maxDiscount: number; validFrom?: string;
  validTo?: string; usageLimit: number; perUserLimit: number; usageCount: number; customerCount?: number; isActive: boolean;
};
export type AdminCouponUsage = {
  coupon: AdminCoupon;
  customerCount: number;
  orderCount: number;
  customers: Array<{
    name: string;
    email: string;
    phone: string;
    orderCount: number;
    totalSpent: number;
    totalDiscount: number;
    lastUsedAt?: string;
  }>;
  orders: Array<{
    id: number;
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    amount: number;
    discount: number;
    status: string;
    paymentStatus: string;
    createdAt?: string;
  }>;
};
export type AdminCartItem = { product: AdminProduct; quantity: number; updatedAt?: string };
export type PaginatedResponse = { total: number; currentPage: number; totalPages: number };

export const adminApi = {
  profile: () => adminRequest<AdminProfile>("/admin/profile"),
  login: (payload: unknown) => adminRequest<AdminProfile>("/admin/login", json("POST", payload)),
  logout: () => adminRequest<{ message: string }>("/admin/logout", json("POST")),
  requestOtp: (email: string) => adminRequest<{ message: string }>("/admin/otp/request", json("POST", { email })),
  verifyOtp: (email: string, otp: string) => adminRequest<AdminProfile>("/admin/otp/verify", json("POST", { email, otp })),
  requestReset: (email: string) => adminRequest<{ message: string }>("/admin/password-reset/request", json("POST", { email })),
  confirmReset: (payload: unknown) => adminRequest<{ message: string }>("/admin/password-reset/confirm", json("POST", payload)),
  changePassword: (payload: unknown) => adminRequest<{ message: string }>("/admin/change-password", json("POST", payload)),
  dashboard: () => adminRequest<{ stats: Record<string, number>; recentOrders: AdminOrder[] }>("/admin/dashboard"),
  categories: () => adminRequest<{ categories: AdminCategory[] }>("/products/admin/categories"),
  createCategory: (payload: { name: string; imageUrl?: string }) => adminRequest<AdminCategory>("/products/admin/categories", json("POST", payload)),
  updateCategory: (id: number, payload: { name: string; imageUrl?: string }) => adminRequest<AdminCategory>(`/products/admin/categories/${id}`, json("PUT", payload)),
  deleteCategory: (id: number) => adminRequest<{ message: string }>(`/products/admin/categories/${id}`, json("DELETE")),
  products: (query = "page=1&limit=10") => adminRequest<{ products: AdminProduct[] } & PaginatedResponse>(`/products/admin/all?${query}`),
  saveProduct: (payload: unknown, id?: number) => adminRequest<AdminProduct>(id ? `/products/${id}` : "/products", json(id ? "PUT" : "POST", payload)),
  productStatus: (id: number, payload: unknown) => adminRequest<AdminProduct>(`/products/${id}/status`, json("PATCH", payload)),
  deleteProduct: (id: number) => adminRequest<{ message: string }>(`/products/${id}`, json("DELETE")),
  deleteProductPermanently: (id: number) => adminRequest<{ message: string }>(`/products/${id}/permanent`, json("DELETE")),
  uploadImage: (image: string, folder = "catalog", preset = "") => adminRequest<{ path: string; url?: string; width: number; height: number }>("/admin/uploads/image", json("POST", { image, folder, preset })),
  orders: (query = "page=1&limit=10") => adminRequest<{ orders: AdminOrder[]; stats: Record<string, number> } & PaginatedResponse>(`/admin/orders?${query}`),
  order: (id: number | string) => adminRequest<AdminOrder>(`/admin/orders/${id}`),
  orderStatus: (id: number, status: string, notes = "") => adminRequest<AdminOrder>(`/admin/orders/${id}/status`, json("PATCH", { status, notes })),
  paymentReview: (id: number, action: "approve" | "reject", reason = "") => adminRequest<AdminOrder>(`/admin/orders/${id}/payment-review`, json("POST", { action, reason })),
  reviews: (query = "page=1&limit=10") => adminRequest<{ testimonials: AdminReview[] } & PaginatedResponse>(`/admin/testimonials?${query}`),
  saveReview: (payload: unknown, id?: number) => adminRequest<AdminReview>(id ? `/admin/testimonials/${id}` : "/admin/testimonials", json(id ? "PUT" : "POST", payload)),
  reviewVisible: (id: number, isVisible: boolean) => adminRequest<AdminReview>(`/admin/testimonials/${id}/visible`, json("PATCH", { isVisible })),
  deleteReview: (id: number) => adminRequest<{ message: string }>(`/admin/testimonials/${id}`, json("DELETE")),
  users: (query = "page=1&limit=10") => adminRequest<{ users: AdminUser[] } & PaginatedResponse>(`/admin/users?${query}`),
  userOrders: (id: number) => adminRequest<AdminOrder[]>(`/admin/users/${id}/orders`),
  userWishlist: (id: number) => adminRequest<{ products: AdminProduct[] }>(`/admin/users/${id}/wishlist`),
  userCart: (id: number) => adminRequest<{ items: AdminCartItem[] }>(`/admin/users/${id}/cart`),
  userStatus: (id: number, isActive: boolean) => adminRequest<AdminUser>(`/admin/users/${id}/status`, json("PATCH", { isActive })),
  coupons: (query = "page=1&limit=10") => adminRequest<{ coupons: AdminCoupon[] } & PaginatedResponse>(`/admin/coupons?${query}`),
  couponUsage: (id: string | number) => adminRequest<AdminCouponUsage>(`/admin/coupons/${encodeURIComponent(id)}/usage`),
  saveCoupon: (payload: unknown, id?: number) => adminRequest<AdminCoupon>(id ? `/admin/coupons/${id}` : "/admin/coupons", json(id ? "PUT" : "POST", payload)),
  couponActive: (id: number, isActive: boolean) => adminRequest<AdminCoupon>(`/admin/coupons/${id}/active`, json("PATCH", { isActive })),
  deleteCoupon: (id: number) => adminRequest<{ message: string }>(`/admin/coupons/${id}`, json("DELETE")),
  contentBlocks: () => adminRequest<{ blocks: ContentBlock[] }>("/admin/content-blocks"),
  saveContentBlock: (key: string, payload: unknown) => adminRequest<{ message: string }>(`/admin/content-blocks/${key}`, json("PUT", payload)),
};

export { API_BASE_URL };
