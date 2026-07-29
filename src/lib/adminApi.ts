const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

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
    throw new AdminApiError("Admin service is offline. Start or deploy the Annai backend and check VITE_API_BASE_URL.", 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new AdminApiError(data.message || "Admin request failed", response.status);
  return data as T;
}

const json = (method: string, payload?: unknown): RequestInit => ({
  method,
  body: payload === undefined ? undefined : JSON.stringify(payload),
});

export type AdminProfile = { id: number; name: string; username?: string; email: string; role: string };
export type AdminCategory = { id: number; name: string; createdAt?: string };
export type AdminProduct = {
  id: number; name: string; slug: string; category: string; brand: string; badge: string;
  price: number; comparePrice: number; stock: number; rating: number; reviewCount: number;
  image: string; imageUrl: string; images: string[]; description: string; tagline: string;
  isActive: boolean; isFeatured: boolean; inStock: boolean; relatedProductIds: string[];
  specs?: Record<string, unknown>;
};
export type AdminOrder = {
  id: number; orderId: string; product: string; category: string; amount: number; status: string;
  paymentStatus: string; paymentMethod: string; paymentProofUrl?: string; deliveryAddress: string;
  invoiceNumber: string; notes: string; customerName: string; customerEmail: string;
  customerPhone: string; createdAt: string;
};
export type AdminReview = {
  id: number; name: string; role: string; rating: number; text: string; imageUrl?: string;
  source?: string; reviewDate?: string; isVisible: boolean; createdAt?: string;
};
export type ContentBlock = {
  id?: number; block_key: string; title: string; body: string; isActive: boolean;
};

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
  createCategory: (name: string) => adminRequest<AdminCategory>("/products/admin/categories", json("POST", { name })),
  updateCategory: (id: number, name: string) => adminRequest<AdminCategory>(`/products/admin/categories/${id}`, json("PUT", { name })),
  deleteCategory: (id: number) => adminRequest<{ message: string }>(`/products/admin/categories/${id}`, json("DELETE")),
  products: (query = "page=1&limit=100") => adminRequest<{ products: AdminProduct[]; total: number }>(`/products/admin/all?${query}`),
  saveProduct: (payload: unknown, id?: number) => adminRequest<AdminProduct>(id ? `/products/${id}` : "/products", json(id ? "PUT" : "POST", payload)),
  productStatus: (id: number, payload: unknown) => adminRequest<AdminProduct>(`/products/${id}/status`, json("PATCH", payload)),
  deleteProduct: (id: number) => adminRequest<{ message: string }>(`/products/${id}`, json("DELETE")),
  uploadImage: (image: string, folder = "catalog") => adminRequest<{ path: string; url?: string }>("/admin/uploads/image", json("POST", { image, folder })),
  orders: (query = "page=1&limit=100") => adminRequest<{ orders: AdminOrder[]; total: number; stats: Record<string, number> }>(`/admin/orders?${query}`),
  orderStatus: (id: number, status: string, notes = "") => adminRequest<AdminOrder>(`/admin/orders/${id}/status`, json("PATCH", { status, notes })),
  paymentReview: (id: number, action: "approve" | "reject", reason = "") => adminRequest<AdminOrder>(`/admin/orders/${id}/payment-review`, json("POST", { action, reason })),
  reviews: (query = "page=1&limit=100") => adminRequest<{ testimonials: AdminReview[]; total: number }>(`/admin/testimonials?${query}`),
  saveReview: (payload: unknown, id?: number) => adminRequest<AdminReview>(id ? `/admin/testimonials/${id}` : "/admin/testimonials", json(id ? "PUT" : "POST", payload)),
  reviewVisible: (id: number, isVisible: boolean) => adminRequest<AdminReview>(`/admin/testimonials/${id}/visible`, json("PATCH", { isVisible })),
  deleteReview: (id: number) => adminRequest<{ message: string }>(`/admin/testimonials/${id}`, json("DELETE")),
  contentBlocks: () => adminRequest<{ blocks: ContentBlock[] }>("/admin/content-blocks"),
  saveContentBlock: (key: string, payload: unknown) => adminRequest<{ message: string }>(`/admin/content-blocks/${key}`, json("PUT", payload)),
};

export { API_BASE_URL };
