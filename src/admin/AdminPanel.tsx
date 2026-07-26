import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Moon,
  Package,
  Plus,
  Power,
  Printer,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Sun,
  Trash2,
  Users,
  X,
} from "lucide-react";
import logo from "../assets/logo.png";
import logoDark from "../assets/logo-dark-theme.png";

type AdminTab =
  | "dashboard"
  | "products"
  | "orders"
  | "enquiries"
  | "users"
  | "testimonials"
  | "content"
  | "reports";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "Active" | "Draft";
};

type Order = {
  dbId?: number;
  id: string;
  customer: string;
  phone: string;
  product: string;
  amount: number;
  status: "Pending" | "Processing" | "Delivered" | "Cancelled";
  payment: "Paid" | "Pending";
  date: string;
};

type Enquiry = {
  id: number;
  name: string;
  phone: string;
  program: string;
  source: string;
  status: "New" | "Contacted" | "Converted";
};

type Member = {
  id: number;
  name: string;
  email: string;
  plan: string;
  active: boolean;
  lastVisit: string;
};

type Testimonial = {
  id: number;
  name: string;
  rating: number;
  text: string;
  visible: boolean;
};

const money = (value: number) => `Rs. ${value.toLocaleString("en-IN")}`;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const tokenKey = "highgrade_admin_token";

const apiRequest = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem(tokenKey);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data as T;
};

const mapProduct = (item: any): Product => ({
  id: Number(item.id || item._id),
  name: item.name || "",
  category: item.category || "",
  price: Number(item.price || item.displayPrice || 0),
  stock: Number(item.stock || 0),
  status: item.isActive === false ? "Draft" : "Active",
});

const mapOrder = (item: any): Order => ({
  dbId: Number(item.id || item._id || 0),
  id: item.orderId || item.order_id || String(item.id || item._id),
  customer: item.customerName || item.user?.name || item.customer_name || "",
  phone: item.customerPhone || item.user?.phone || item.customer_phone || "",
  product: item.product || "",
  amount: Number(item.amount || 0),
  status: item.status || "Pending",
  payment: item.paymentStatus === "Paid" || item.payment_status === "Paid" ? "Paid" : "Pending",
  date: String(item.createdAt || item.created_at || "").slice(0, 10),
});

const mapEnquiry = (item: any): Enquiry => ({
  id: Number(item.id || item._id),
  name: item.name || "",
  phone: item.phone || "",
  program: item.program || "",
  source: item.source || "Website",
  status: item.status === "Closed" ? "Contacted" : item.status || "New",
});

const mapMember = (item: any): Member => ({
  id: Number(item.id || item._id),
  name: item.name || "",
  email: item.email || "",
  plan: item.plan || "Member",
  active: item.isActive !== false,
  lastVisit: item.updatedAt ? String(item.updatedAt).slice(0, 10) : "Recently",
});

const mapTestimonial = (item: any): Testimonial => ({
  id: Number(item.id || item._id),
  name: item.name || "",
  rating: Number(item.rating || 5),
  text: item.text || "",
  visible: item.isVisible !== false,
});

const initialProducts: Product[] = [
  { id: 1, name: "Highgrade Whey Elite", category: "Protein", price: 2499, stock: 18, status: "Active" },
  { id: 2, name: "Creatine Monohydrate", category: "Strength", price: 899, stock: 26, status: "Active" },
  { id: 3, name: "Recovery BCAA", category: "Recovery", price: 1199, stock: 14, status: "Active" },
  { id: 4, name: "Pre Workout Rush", category: "Performance", price: 1599, stock: 9, status: "Draft" },
];

const initialOrders: Order[] = [
  { id: "HGF-1001", customer: "Bhadri", phone: "07449143583", product: "Highgrade Whey Elite", amount: 2499, status: "Pending", payment: "Paid", date: "2026-07-07" },
  { id: "HGF-1002", customer: "Priya S", phone: "9876543210", product: "Creatine Monohydrate", amount: 899, status: "Processing", payment: "Paid", date: "2026-07-06" },
  { id: "HGF-1003", customer: "Arun K", phone: "9876500012", product: "Recovery BCAA", amount: 1199, status: "Delivered", payment: "Paid", date: "2026-07-05" },
];

const initialEnquiries: Enquiry[] = [
  { id: 1, name: "Kavin", phone: "9876543211", program: "Personal Training", source: "Website", status: "New" },
  { id: 2, name: "Meena", phone: "9876543212", program: "Highgrade for Womens", source: "Enquiry Form", status: "Contacted" },
  { id: 3, name: "Bhadri", phone: "07449143583", program: "Supplement Purchase", source: "Shop", status: "Converted" },
];

const initialMembers: Member[] = [
  { id: 1, name: "Bhadri", email: "bhadri@gmail.com", plan: "Annual", active: true, lastVisit: "Today" },
  { id: 2, name: "Priya S", email: "priya@example.com", plan: "Quarterly", active: true, lastVisit: "Yesterday" },
  { id: 3, name: "Arun K", email: "arun@example.com", plan: "Monthly", active: false, lastVisit: "5 days ago" },
];

const initialTestimonials: Testimonial[] = [
  { id: 1, name: "Bhadri", rating: 5, text: "Manoj coach made training simple and consistent.", visible: true },
  { id: 2, name: "Meena", rating: 5, text: "Shebani helped me feel confident with strength training.", visible: true },
];

const tabs: Array<{ id: AdminTab; label: string; icon: ReactNode }> = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={19} /> },
  { id: "products", label: "Products", icon: <Package size={19} /> },
  { id: "orders", label: "Orders", icon: <ShoppingCart size={19} /> },
  { id: "enquiries", label: "Enquiries", icon: <ClipboardList size={19} /> },
  { id: "users", label: "Users", icon: <Users size={19} /> },
  { id: "testimonials", label: "Reviews", icon: <Star size={19} /> },
  { id: "content", label: "Content", icon: <BookOpen size={19} /> },
  { id: "reports", label: "Reports", icon: <BarChart3 size={19} /> },
];

const AdminCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`admin-card rounded-3xl border p-5 shadow-sm ${className}`}>{children}</div>
);

const Field = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`admin-input w-full rounded-2xl border px-4 py-3 text-sm outline-none ${props.className || ""}`}
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`admin-input w-full rounded-2xl border px-4 py-3 text-sm outline-none ${props.className || ""}`}
  />
);

const StatusPill = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "red" | "amber" | "neutral" }) => (
  <span className={`admin-pill admin-pill-${tone} inline-flex rounded-full px-3 py-1 text-xs font-medium`}>
    {children}
  </span>
);

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dark, setDark] = useState(document.documentElement.classList.contains("theme-dark"));
  const [query, setQuery] = useState("");
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(tokenKey) || "");
  const [loginForm, setLoginForm] = useState({ username: "Manoj", password: "" });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [members, setMembers] = useState(initialMembers);
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [productForm, setProductForm] = useState({ name: "", category: "Protein", price: "", stock: "" });
  const [testimonialForm, setTestimonialForm] = useState({ name: "", rating: "5", text: "" });

  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
  const pendingOrders = orders.filter((order) => order.status === "Pending").length;
  const newEnquiries = enquiries.filter((item) => item.status === "New").length;
  const activeMembers = members.filter((member) => member.active).length;

  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [productsData, ordersData, enquiriesData, usersData, testimonialsData] = await Promise.all([
        apiRequest<any>("/products/admin/all?limit=100"),
        apiRequest<any>("/admin/orders?limit=100"),
        apiRequest<any>("/admin/enquiries?limit=100"),
        apiRequest<any>("/admin/users?limit=100"),
        apiRequest<any>("/admin/testimonials"),
      ]);
      setProducts((productsData.products || []).map(mapProduct));
      setOrders((ordersData.orders || []).map(mapOrder));
      setEnquiries((enquiriesData.enquiries || []).map(mapEnquiry));
      setMembers((usersData.users || []).map(mapMember));
      setTestimonials((testimonialsData.testimonials || []).map(mapTestimonial));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load admin data. Check backend and MySQL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) loadAdminData();
  }, [adminToken]);

  const loginAdmin = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<any>("/admin/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });
      localStorage.setItem(tokenKey, data.token);
      setAdminToken(data.token);
      setNotice("Admin login successful.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem(tokenKey);
    setAdminToken("");
  };

  const toggleTheme = () => {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle("theme-dark", next);
      localStorage.setItem("high-grade-theme", next ? "dark" : "light");
      return next;
    });
  };

  const addProduct = async () => {
    if (!productForm.name.trim() || !productForm.price || !productForm.stock) return;
    setLoading(true);
    setError("");
    try {
      const created = await apiRequest<any>("/products", {
        method: "POST",
        body: JSON.stringify({
          name: productForm.name.trim(),
          category: productForm.category,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          isActive: true,
          inStock: Number(productForm.stock) > 0,
        }),
      });
      setProducts((current) => [mapProduct(created), ...current]);
      setProductForm({ name: "", category: "Protein", price: "", stock: "" });
      setNotice("Product created in MySQL.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product create failed.");
    } finally {
      setLoading(false);
    }
  };

  const addTestimonial = async () => {
    if (!testimonialForm.name.trim() || !testimonialForm.text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const created = await apiRequest<any>("/admin/testimonials", {
        method: "POST",
        body: JSON.stringify({
          name: testimonialForm.name.trim(),
          rating: Number(testimonialForm.rating),
          text: testimonialForm.text.trim(),
        }),
      });
      setTestimonials((current) => [mapTestimonial(created), ...current]);
      setTestimonialForm({ name: "", rating: "5", text: "" });
      setNotice("Testimonial saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Testimonial create failed.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/products/${product.id}`, { method: "DELETE" });
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setNotice("Product deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product delete failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (order: Order, status: Order["status"]) => {
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/admin/orders/${order.dbId || order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, paymentStatus: order.payment }),
      });
      await loadAdminData();
      setNotice("Order status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order update failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateEnquiryStatus = async (item: Enquiry, status: Enquiry["status"]) => {
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/admin/enquiries/${item.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setEnquiries((current) => current.map((row) => row.id === item.id ? { ...row, status } : row));
      setNotice("Enquiry status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enquiry update failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = async (member: Member) => {
    setLoading(true);
    setError("");
    try {
      const updated = await apiRequest<any>(`/admin/users/${member.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !member.active }),
      });
      setMembers((current) => current.map((item) => item.id === member.id ? mapMember(updated) : item));
      setNotice("User status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "User update failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTestimonial = async (item: Testimonial) => {
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/admin/testimonials/${item.id}/visible`, {
        method: "PATCH",
        body: JSON.stringify({ isVisible: !item.visible }),
      });
      setTestimonials((current) => current.map((row) => row.id === item.id ? { ...row, visible: !row.visible } : row));
      setNotice("Testimonial visibility updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Testimonial update failed.");
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = (order: Order) => {
    const html = `
      <html>
        <head>
          <title>${order.id} Invoice</title>
          <style>
            body{font-family:Arial,sans-serif;padding:32px;color:#111}
            .box{border:1px solid #ddd;border-radius:18px;padding:24px;max-width:720px;margin:auto}
            h1{color:#e11d2e}.row{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:12px 0}
            .total{font-size:24px;font-weight:bold;color:#e11d2e}
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Highgrade Fitness Invoice</h1>
            <p>Order ${order.id} | ${order.date}</p>
            <div class="row"><span>Customer</span><strong>${order.customer}</strong></div>
            <div class="row"><span>Phone</span><strong>${order.phone}</strong></div>
            <div class="row"><span>Product</span><strong>${order.product}</strong></div>
            <div class="row"><span>Status</span><strong>${order.status}</strong></div>
            <div class="row total"><span>Total</span><span>${money(order.amount)}</span></div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>`;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const filteredProducts = products.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  const filteredOrders = orders.filter((item) => `${item.id} ${item.customer} ${item.product}`.toLowerCase().includes(query.toLowerCase()));
  const filteredMembers = members.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase()));

  if (!adminToken) {
    return (
      <div className="admin-shell grid min-h-screen place-items-center p-4">
        <AdminCard className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img src={dark ? logoDark : logo} alt="Highgrade" className="mx-auto h-20 w-auto object-contain" />
            <p className="mt-5 text-xs uppercase tracking-[0.24em] text-amber-600">Admin Control</p>
            <h1 className="mt-2 text-3xl font-semibold">Highgrade Login</h1>
            <p className="mt-2 text-sm text-slate-500">Sign in to manage products, users, orders, enquiries, and website content.</p>
          </div>
          <div className="space-y-3">
            <Field placeholder="Admin name or email" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
            <Field placeholder="Password" type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && loginAdmin()} />
            {error && <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>}
            <button disabled={loading} onClick={loginAdmin} className="w-full rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
              {loading ? "Signing in..." : "Login to Admin Panel"}
            </button>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="admin-shell min-h-screen">
      <aside className={`admin-sidebar fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all ${sidebarOpen ? "admin-sidebar-open w-72" : "w-20"}`}>
        <div className="flex h-20 items-center gap-3 border-b px-5">
          <img src={logo} alt="Highgrade" className="theme-logo-light h-12 w-auto object-contain" />
          <img src={logoDark} alt="Highgrade" className="theme-logo-dark h-12 w-auto object-contain" />
          {/* {sidebarOpen && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Highgrade Admin</p>
              <p className="text-xs text-amber-600">Control panel</p>
            </div>
          )} */}
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`admin-nav-item flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${active ? "is-active" : ""}`}
              >
                {tab.icon}
                {sidebarOpen && <span className="flex-1">{tab.label}</span>}
                {active && sidebarOpen && <ChevronRight size={16} />}
              </button>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <button onClick={logoutAdmin} className="admin-nav-item flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm">
            <Power size={18} /> {sidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      <div className={`transition-all ${sidebarOpen ? "lg:pl-72" : "lg:pl-20"}`}>
        <header className="admin-topbar sticky top-0 z-30 border-b px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen((value) => !value)} className="admin-icon-button rounded-2xl p-3">
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-semibold">Highgrade Control</h1>
                <p className="text-sm text-slate-500">Products, orders, users, enquiries and content.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="admin-icon-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
                {dark ? <Sun size={16} /> : <Moon size={16} />}
                {dark ? "Light" : "Dark"}
              </button>
              <button className="admin-icon-button rounded-full p-3"><Bell size={18} /></button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {(error || notice || loading) && (
            <div className="mb-4 grid gap-2">
              {loading && <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Syncing...</p>}
              {error && <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>}
              {notice && !error && <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</p>}
            </div>
          )}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <label className="admin-search flex min-w-[260px] flex-1 items-center gap-3 rounded-2xl border px-4 py-3">
              <Search size={18} className="text-amber-600" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search admin data..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
            <button className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
              Export Data
            </button>
          </div>

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Revenue", money(totalRevenue), <BarChart3 size={22} />],
                  ["Orders", orders.length, <ShoppingCart size={22} />],
                  ["Pending", pendingOrders, <ClipboardList size={22} />],
                  ["Active Users", activeMembers, <Users size={22} />],
                ].map(([label, value, icon]) => (
                  <AdminCard key={label as string}>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white">{icon}</div>
                    <p className="text-3xl font-semibold">{value}</p>
                    <p className="mt-1 text-sm text-slate-500">{label as string}</p>
                  </AdminCard>
                ))}
              </div>
              <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
                <AdminCard>
                  <h2 className="mb-4 text-xl font-semibold">Recent Orders</h2>
                  <DataTable
                    heads={["Order", "Customer", "Product", "Amount", "Status"]}
                    rows={orders.map((order) => [
                      order.id,
                      order.customer,
                      order.product,
                      money(order.amount),
                      <StatusPill key={order.id} tone={order.status === "Delivered" ? "green" : order.status === "Pending" ? "amber" : "neutral"}>{order.status}</StatusPill>,
                    ])}
                  />
                </AdminCard>
                <AdminCard>
                  <h2 className="mb-4 text-xl font-semibold">Lead Pipeline</h2>
                  <div className="space-y-4">
                    {enquiries.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b pb-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-500">{item.program}</p>
                        </div>
                        <StatusPill tone={item.status === "Converted" ? "green" : item.status === "New" ? "amber" : "neutral"}>{item.status}</StatusPill>
                      </div>
                    ))}
                  </div>
                </AdminCard>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
              <AdminCard>
                <h2 className="mb-4 text-xl font-semibold">Add Product</h2>
                <div className="space-y-3">
                  <Field placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                  <Select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
                    {["Protein", "Strength", "Recovery", "Performance", "Wellness"].map((item) => <option key={item}>{item}</option>)}
                  </Select>
                  <Field placeholder="Price" type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                  <Field placeholder="Stock" type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
                  <button onClick={addProduct} className="w-full rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                    <Plus className="mr-2 inline h-4 w-4" /> Add Product
                  </button>
                </div>
              </AdminCard>
              <AdminCard>
                <h2 className="mb-4 text-xl font-semibold">Product Inventory</h2>
                <DataTable
                  heads={["Name", "Category", "Price", "Stock", "Status", "Action"]}
                  rows={filteredProducts.map((product) => [
                    product.name,
                    product.category,
                    money(product.price),
                    product.stock,
                    <StatusPill key={product.id} tone={product.status === "Active" ? "green" : "neutral"}>{product.status}</StatusPill>,
                    <button key={product.id} onClick={() => deleteProduct(product)} className="text-amber-600"><Trash2 size={16} /></button>,
                  ])}
                />
              </AdminCard>
            </div>
          )}

          {activeTab === "orders" && (
            <AdminCard>
              <h2 className="mb-4 text-xl font-semibold">Orders and Invoices</h2>
              <DataTable
                heads={["Order", "Customer", "Phone", "Product", "Amount", "Status", "Actions"]}
                rows={filteredOrders.map((order) => [
                  order.id,
                  order.customer,
                  order.phone,
                  order.product,
                  money(order.amount),
                  <Select key={order.id} value={order.status} onChange={(e) => updateOrderStatus(order, e.target.value as Order["status"])}>
                    {["Pending", "Processing", "Delivered", "Cancelled"].map((item) => <option key={item}>{item}</option>)}
                  </Select>,
                  <div key={order.id} className="flex gap-2">
                    <button onClick={() => setSelectedOrder(order)} className="admin-icon-button rounded-xl p-2"><Eye size={16} /></button>
                    <button onClick={() => printInvoice(order)} className="admin-icon-button rounded-xl p-2"><Printer size={16} /></button>
                  </div>,
                ])}
              />
            </AdminCard>
          )}

          {activeTab === "enquiries" && (
            <AdminCard>
              <h2 className="mb-4 text-xl font-semibold">Enquiry Form Details</h2>
              <DataTable
                heads={["Name", "Phone", "Program", "Source", "Status"]}
                rows={enquiries.map((item) => [
                  item.name,
                  item.phone,
                  item.program,
                  item.source,
                  <Select key={item.id} value={item.status} onChange={(e) => updateEnquiryStatus(item, e.target.value as Enquiry["status"])}>
                    {["New", "Contacted", "Converted"].map((status) => <option key={status}>{status}</option>)}
                  </Select>,
                ])}
              />
            </AdminCard>
          )}

          {activeTab === "users" && (
            <AdminCard>
              <h2 className="mb-4 text-xl font-semibold">User Management</h2>
              <DataTable
                heads={["Name", "Email", "Plan", "Last Visit", "Status", "Action"]}
                rows={filteredMembers.map((member) => [
                  member.name,
                  member.email,
                  member.plan,
                  member.lastVisit,
                  <StatusPill key={member.id} tone={member.active ? "green" : "red"}>{member.active ? "Active" : "Inactive"}</StatusPill>,
                  <button key={member.id} onClick={() => toggleMember(member)} className="rounded-full border border-amber-500 px-4 py-2 text-xs font-medium text-amber-600">
                    {member.active ? "Deactivate" : "Activate"}
                  </button>,
                ])}
              />
            </AdminCard>
          )}

          {activeTab === "testimonials" && (
            <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
              <AdminCard>
                <h2 className="mb-4 text-xl font-semibold">Add Testimonial</h2>
                <div className="space-y-3">
                  <Field placeholder="Client name" value={testimonialForm.name} onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })} />
                  <Select value={testimonialForm.rating} onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value })}>
                    {[5, 4, 3, 2, 1].map((item) => <option key={item}>{item}</option>)}
                  </Select>
                  <textarea placeholder="Testimonial" value={testimonialForm.text} onChange={(e) => setTestimonialForm({ ...testimonialForm, text: e.target.value })} className="admin-input min-h-32 w-full rounded-2xl border px-4 py-3 text-sm outline-none" />
                  <button onClick={addTestimonial} className="w-full rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">Add Testimonial</button>
                </div>
              </AdminCard>
              <AdminCard>
                <h2 className="mb-4 text-xl font-semibold">Testimonials</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {testimonials.map((item) => (
                    <div key={item.id} className="admin-soft-panel rounded-2xl border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold">{item.name}</p>
                        <span className="text-amber-600">{"â˜…".repeat(item.rating)}</span>
                      </div>
                      <p className="text-sm leading-6 text-slate-500">{item.text}</p>
                      <button onClick={() => toggleTestimonial(item)} className="mt-4 rounded-full border border-amber-500 px-4 py-2 text-xs text-amber-600">
                        {item.visible ? "Hide" : "Show"}
                      </button>
                    </div>
                  ))}
                </div>
              </AdminCard>
            </div>
          )}

          {activeTab === "content" && (
            <div className="grid gap-5 xl:grid-cols-3">
              {[
                ["Blog Editor", "Create fitness posts, nutrition guides and SEO articles.", <FileText key="blog" />],
                ["Gallery Manager", "Upload gym photos, transformations and facility media.", <Boxes key="gallery" />],
                ["Website Sections", "Manage home page counts, banners, FAQs and program copy.", <MessageSquareText key="sections" />],
              ].map(([title, text, icon]) => (
                <AdminCard key={title as string}>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white">{icon}</div>
                  <h2 className="text-xl font-semibold">{title as string}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{text as string}</p>
                  <button className="mt-5 rounded-full border border-amber-500 px-5 py-2 text-sm font-medium text-amber-600">Manage</button>
                </AdminCard>
              ))}
            </div>
          )}

          {activeTab === "reports" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
              <AdminCard>
                <h2 className="mb-4 text-xl font-semibold">Reports and Analytics</h2>
                <div className="space-y-4">
                  {["Revenue report", "Membership expiry report", "Lead conversion report", "Product stock report"].map((item) => (
                    <div key={item} className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="text-amber-600" size={20} />
                        <span>{item}</span>
                      </div>
                      <button className="admin-icon-button rounded-xl p-2"><Download size={16} /></button>
                    </div>
                  ))}
                </div>
              </AdminCard>
              <AdminCard>
                <h2 className="mb-4 text-xl font-semibold">Database Ready</h2>
                <p className="text-sm leading-7 text-slate-500">
                  MySQL schema and PHP API files are included under the backend folder for products, orders, enquiries, users, testimonials and audit logs.
                </p>
              </AdminCard>
            </div>
          )}
        </main>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-amber-800/70 p-4">
          <AdminCard className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-amber-600">Order Details</p>
                <h2 className="text-2xl font-semibold">{selectedOrder.id}</h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="admin-icon-button rounded-xl p-2"><X size={18} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Customer", selectedOrder.customer],
                ["Phone", selectedOrder.phone],
                ["Product", selectedOrder.product],
                ["Amount", money(selectedOrder.amount)],
                ["Payment", selectedOrder.payment],
                ["Date", selectedOrder.date],
              ].map(([label, value]) => (
                <div key={label} className="admin-soft-panel rounded-2xl border p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <button onClick={() => printInvoice(selectedOrder)} className="mt-5 rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
              <Printer className="mr-2 inline h-4 w-4" /> Print Invoice
            </button>
          </AdminCard>
        </div>
      )}
    </div>
  );
};

const DataTable = ({ heads, rows }: { heads: string[]; rows: ReactNode[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[760px] text-sm">
      <thead>
        <tr className="border-b text-left text-xs uppercase tracking-[0.16em] text-slate-500">
          {heads.map((head) => <th key={head} className="px-3 py-3 font-medium">{head}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="admin-table-row border-b">
            {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-4 align-middle">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default AdminPanel;
