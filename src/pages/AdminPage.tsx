import {
  Boxes, ChevronRight, CircleDollarSign, Eye, EyeOff, ImagePlus, LayoutDashboard,
  Loader2 as LoaderCircle, LockKeyhole, LogOut, Menu, Package, Pencil, Plus, ReceiptText,
  RefreshCw, Save, Search, Settings, ShieldCheck, ShoppingBag, Star, Tags, Trash2,
  TicketPercent, Upload, Users, X,
} from "lucide-react";
import { FocusEvent, FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  adminApi, AdminApiError, AdminCartItem, AdminCategory, AdminCoupon, AdminCouponUsage, AdminOrder, AdminProduct,
  AdminProfile, AdminReview, AdminUser, API_BASE_URL, ContentBlock, HomeBanner,
} from "../lib/adminApi";
import logo from "../assets/logo.png";

type View = "dashboard" | "products" | "categories" | "orders" | "customers" | "reviews" | "coupons" | "banners" | "popup" | "settings";
type Notice = { type: "success" | "error"; text: string } | null;

const nav: Array<[View, string, typeof LayoutDashboard]> = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["products", "Products", ShoppingBag],
  ["categories", "Categories", Tags],
  ["orders", "All orders", ReceiptText],
  ["customers", "Customers", Users],
  ["reviews", "Reviews", Star],
  ["coupons", "Coupon codes", TicketPercent],
  ["banners", "Home banners", ImagePlus],
  ["popup", "Popup advertisement", ImagePlus],
  ["settings", "Settings", Settings],
];
const viewDescriptions: Record<View, string> = {
  dashboard: "Store performance, orders and inventory overview",
  products: "Products, pricing, photos, stock and visibility",
  categories: "Collection categories and category artwork",
  orders: "Payments, verification and order fulfilment",
  customers: "Customer profiles, carts, orders and wishlists",
  reviews: "Customer review publishing and moderation",
  coupons: "Discount codes, dates and usage limits",
  banners: "Home carousel artwork, content, order and visibility",
  popup: "Home-page promotional popup management",
  settings: "Admin account and security settings",
};

const inputClass = "w-full rounded-xl border border-amber-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const buttonClass = "inline-flex !w-auto items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#b8860b] to-[#dfb72d] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50";
const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;
const ADMIN_LOGIN_EMAIL = "annaisilverjewellerytky@gmail.com";
const adminAssetUrl = (value: string) => value.startsWith("/uploads/") ? `${apiOrigin}${value}` : value;
const storedAssetUrl = (value: string) => value.startsWith(`${apiOrigin}/uploads/`) ? value.slice(apiOrigin.length) : value;
const fileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error("Unable to read the selected image."));
  reader.readAsDataURL(file);
});

function Message({ notice, clear }: { notice: Notice; clear: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!notice) {
      setVisible(false);
      return;
    }
    const showTimer = window.setTimeout(() => setVisible(true), 10);
    const fadeTimer = window.setTimeout(() => setVisible(false), 1700);
    const clearTimer = window.setTimeout(clear, 2000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [clear, notice]);
  if (!notice) return null;
  return <div className={`fixed right-4 top-4 z-[300] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl transition-all duration-300 ease-out ${visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"} ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
    <span className="flex-1">{notice.text}</span><button onClick={clear} aria-label="Dismiss"><X className="h-4 w-4" /></button>
  </div>;
}

function PasswordControl({ value, onChange, error, autoComplete }: { value: string; onChange: (value: string) => void; error?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  return <div>
    <div className="relative">
      <input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} aria-invalid={Boolean(error)} className={`${inputClass} pr-11 ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`} />
      <button type="button" onClick={() => setVisible((current) => !current)} className="absolute inset-y-0 right-1 grid w-9 place-items-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-700" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
    </div>
    {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
  </div>;
}

function AdminLogin({ onLogin }: { onLogin: (profile: AdminProfile) => void }) {
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [step, setStep] = useState<"request" | "verify">("request");
  const email = ADMIN_LOGIN_EMAIL;
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const next: Record<string, string> = {};
    if (mode === "password" && !password) next.password = "Enter the administrator password.";
    if (mode === "otp" && step === "verify" && !/^\d{6}$/.test(otp)) next.otp = "Enter the 6 digit OTP.";
    if (Object.keys(next).length) {
      setFieldErrors(next);
      setBusy(false);
      return;
    }
    setFieldErrors({});
    try {
      if (mode === "password") onLogin(await adminApi.login({ email, password }));
      else if (mode === "otp" && step === "request") {
        const result = await adminApi.requestOtp(email); setMessage(result.message); setStep("verify");
      } else onLogin(await adminApi.verifyOtp(email, otp));
    } catch (reason) {
      const text = reason instanceof Error ? reason.message : "Unable to sign in";
      if (/otp/i.test(text) && mode === "otp" && step === "verify") setFieldErrors({ otp: text });
      else if (mode === "otp" && step === "request") setError(
        /authentication failed|app password/i.test(text)
          ? "OTP email login was rejected by Gmail. Update the Gmail App Password and restart the backend."
          : text || "OTP could not be sent. Please check the admin email service and try again.",
      );
      else if (/email/i.test(text)) setFieldErrors({ email: text });
      else if (/password|credential|sign in|login/i.test(text)) setFieldErrors({ password: text });
      else setError(text);
    }
    finally { setBusy(false); }
  };

  const switchMode = (next: typeof mode) => { setMode(next); setStep("request"); setOtp(""); setError(""); setMessage(""); setFieldErrors({}); };
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#fff7d6_0,#faf7ef_38%,#f4efe4_100%)] p-4">
    <section className="w-full max-w-md overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-[0_24px_80px_rgba(92,65,12,.15)]">
      <div className="bg-gradient-to-br from-[#fff9e8] to-[#f5e4a3] px-7 py-7 text-center">
        <img src={logo} alt="Annai Jewellery" className="mx-auto h-20 w-auto object-contain" />
        <h1 className="mt-3 text-lg font-semibold text-slate-900">Admin panel</h1>
        <p className="mt-1 text-sm text-slate-600">Secure catalogue and order management</p>
      </div>
      <form onSubmit={submit} noValidate className="space-y-4 p-7">
        <div className="grid grid-cols-2 rounded-xl bg-amber-50 p-1 text-xs font-semibold">
          <button type="button" onClick={() => switchMode("password")} className={`rounded-lg px-3 py-2 ${mode === "password" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500"}`}>Password</button>
          <button type="button" onClick={() => switchMode("otp")} className={`rounded-lg px-3 py-2 ${mode === "otp" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500"}`}>Email OTP</button>
        </div>
        <label className="block text-xs font-semibold text-slate-600">Admin email<input type="email" value={email} readOnly aria-readonly="true" className={`${inputClass} mt-1.5 cursor-not-allowed bg-slate-50 text-slate-600`} /></label>
        {mode === "password" && <label className="block text-xs font-semibold text-slate-600">Password<div className="mt-1.5"><PasswordControl value={password} onChange={(value) => { setPassword(value); setFieldErrors((current) => ({ ...current, password: "" })); }} error={fieldErrors.password} autoComplete="current-password" /></div></label>}
        {mode === "otp" && step === "verify" && <label className="block text-xs font-semibold text-slate-600">6 digit OTP<input autoFocus inputMode="numeric" value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setFieldErrors((current) => ({ ...current, otp: "" })); }} className={`${inputClass} mt-1.5 text-center text-lg tracking-[.35em] ${fieldErrors.otp ? "border-red-400" : ""}`} placeholder="000000" />{fieldErrors.otp && <span className="mt-1.5 block text-xs font-medium text-red-600">{fieldErrors.otp}</span>}</label>}
        {message && <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">{message}</p>}
        {error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <button disabled={busy} className={`${buttonClass} w-full`}>{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{mode === "password" ? "Sign in securely" : step === "request" ? "Send email OTP" : "Verify and sign in"}</button>

      </form>
    </section>
  </main>;
}

function PageHeader({ title, subtitle, action, merged = false }: { title: string; subtitle: string; action?: ReactNode; merged?: boolean }) {
  return <header className={`${merged ? "admin-page-header--merged rounded-t-2xl border border-amber-100 bg-white px-5 py-5 sm:px-6" : "mb-4 px-1"} flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between`}><div><h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1><p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{subtitle}</p></div>{action}</header>;
}

function ListToolbar({ search, setSearch, placeholder, total, refresh }: { search: string; setSearch: (value: string) => void; placeholder: string; total: number; refresh?: () => void }) {
  return <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-[#fffdfa] p-3 sm:flex-row sm:items-center">
    <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-amber-100 bg-white px-3.5 py-2.5 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
      <Search className="h-4 w-4 shrink-0 text-amber-600" />
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      {search && <button type="button" onClick={() => setSearch("")} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-700" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
    </label>
    <div className="flex items-center justify-between gap-3 sm:justify-end">
      <span className="text-xs font-medium text-slate-500">{total.toLocaleString("en-IN")} result{total === 1 ? "" : "s"}</span>
      {refresh && <button type="button" onClick={refresh} className="grid h-9 w-9 place-items-center rounded-lg border border-amber-100 bg-white text-amber-700 transition hover:bg-amber-50" aria-label="Refresh"><RefreshCw className="h-3.5 w-3.5" /></button>}
    </div>
  </div>;
}

function Pagination({ page, totalPages, total, pageSize = 10, onPage }: { page: number; totalPages: number; total: number; pageSize?: number; onPage: (page: number) => void }) {
  if (!total) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1);
  return <footer className="flex flex-col gap-3 border-t border-amber-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <p className="text-xs text-slate-500">Showing <strong className="text-slate-700">{start}–{end}</strong> of <strong className="text-slate-700">{total}</strong></p>
    <nav className="flex items-center gap-1.5" aria-label="Pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-amber-100 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-35">Previous</button>
      {pages.map((item, index) => <span key={item} className="contents">{index > 0 && pages[index - 1] !== item - 1 && <span className="px-1 text-slate-400">…</span>}<button type="button" onClick={() => onPage(item)} aria-current={item === page ? "page" : undefined} className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 text-xs font-semibold ${item === page ? "bg-amber-600 text-white shadow-sm" : "border border-amber-100 bg-white text-slate-600 hover:bg-amber-50"}`}>{item}</button></span>)}
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="rounded-lg border border-amber-100 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-35">Next</button>
    </nav>
  </footer>;
}

function Dashboard({ setView }: { setView: (view: View) => void }) {
  const [data, setData] = useState<{ stats: Record<string, number>; recentOrders: AdminOrder[] } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { adminApi.dashboard().then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <EmptyError message={error} />;
  if (!data) return <Loading />;
  const cards: Array<[string, string | number, typeof ReceiptText, View]> = [
    ["Total orders", data.stats.totalOrders, ReceiptText, "orders"],
    ["Paid revenue", `₹${Number(data.stats.revenue || 0).toLocaleString("en-IN")}`, CircleDollarSign, "orders"],
    ["Products", data.stats.products, Package, "products"],
    ["Customers", data.stats.totalClients, Users, "customers"],
    ["Pending orders", data.stats.pendingOrders, ShoppingBag, "orders"],
    ["Low stock", data.stats.lowStock, Boxes, "products"],
  ];
  return <div className="mx-auto max-w-[1600px]"><PageHeader merged title="Dashboard" subtitle="A live overview of your Annai Jewellery store." />
    <div className="rounded-2xl border border-amber-100 bg-white shadow-[0_8px_28px_rgba(92,65,12,.05)]">
      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">{cards.map(([label, value, Icon, target]) => <button type="button" key={label} onClick={() => setView(target)} className="group rounded-2xl border border-amber-100 bg-white p-6 text-left shadow-[0_8px_28px_rgba(92,65,12,.05)] transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_16px_38px_rgba(92,65,12,.10)]"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-3 text-lg font-semibold text-slate-900">{value ?? 0}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 transition group-hover:bg-amber-600 group-hover:text-white"><Icon className="h-5 w-5" /></span></div><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 opacity-0 transition group-hover:opacity-100">View details <ChevronRight className="h-3.5 w-3.5" /></span></button>)}</div>
      <section className="border-t border-amber-100 p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">Recent orders</h2><button onClick={() => setView("orders")} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">View all <ChevronRight className="h-3.5 w-3.5" /></button></div><OrderTable orders={data.recentOrders} compact /></section>
    </div>
  </div>;
}

const emptyProduct = {
  name: "", slug: "", category: "", brand: "Annai Jewellery", badge: "", price: "", comparePrice: "",
  stock: "1", imageUrl: "", images: [] as string[], description: "", tagline: "", rating: "4.8",
  isActive: true, isFeatured: false, relatedProductIds: [] as string[],
};

function ProductsView({ notify }: { notify: (notice: Notice) => void }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState<AdminProduct | null | undefined>(undefined);
  const [changingVisibility, setChangingVisibility] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([adminApi.products(`page=${page}&limit=10&search=${encodeURIComponent(search.trim())}`), adminApi.categories()]);
      setProducts(p.products); setTotal(p.total); setTotalPages(p.totalPages);
      if (p.currentPage !== page && p.totalPages) setPage(Math.min(page, p.totalPages));
      setCategories(c.categories);
    }
    catch (e) { notify({ type: "error", text: (e as Error).message }); } finally { setLoading(false); }
  }, [notify, page, search]);
  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { setPage(1); }, [search]);
  const filtered = products;
  const remove = async (product: AdminProduct) => {
    if (!confirm(`Archive “${product.name}”?`)) return;
    try { await adminApi.deleteProduct(product.id); notify({ type: "success", text: "Product archived." }); load(); } catch (e) { notify({ type: "error", text: (e as Error).message }); }
  };
  const toggleVisibility = async (product: AdminProduct) => {
    setChangingVisibility(product.id);
    try {
      await adminApi.productStatus(product.id, { isActive: !product.isActive });
      notify({ type: "success", text: product.isActive ? "Product hidden from the store." : "Product is now visible." });
      await load();
    } catch (e) {
      notify({ type: "error", text: (e as Error).message });
    } finally {
      setChangingVisibility(null);
    }
  };
  return <section className="overflow-hidden rounded-[1.4rem] border border-amber-100 bg-white shadow-[0_8px_30px_rgba(77,55,11,.05)]">
    <div className="px-4 pt-5 sm:px-6">
      <PageHeader title="Product Inventory" subtitle="Manage stock, pricing, product photos, badges and visibility." action={<button onClick={() => setEditing(null)} className={buttonClass}><Plus className="h-4 w-4" /> Add product</button>} />
    </div>
    <div className="border-y border-amber-100 px-4 py-4 sm:px-6">
      <ListToolbar search={search} setSearch={setSearch} placeholder="Search products, categories or brands" total={total} refresh={load} />
    </div>
    {loading ? <Loading /> : <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] text-left">
          <thead className="border-b border-amber-100 bg-[#fffdfa] text-[10px] font-bold uppercase tracking-[.18em] text-slate-400"><tr><th className="px-6 py-4">Image</th><th className="px-4 py-4">Name</th><th className="px-4 py-4">Category</th><th className="px-4 py-4">Price</th><th className="px-4 py-4">Stock</th><th className="px-4 py-4">Badge</th><th className="px-4 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
          <tbody>{filtered.map((product) => { const discount = product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0; return <tr key={product.id} className="border-b border-slate-100 text-sm transition last:border-0 hover:bg-amber-50/30"><td className="px-6 py-3"><img src={adminAssetUrl(product.image)} alt="" className="h-14 w-16 rounded-xl border border-amber-100 bg-amber-50 object-cover" /></td><td className="max-w-[260px] px-4 py-3"><p className="truncate font-semibold text-slate-900">{product.name}</p><p className="mt-1 truncate text-xs text-slate-400">{product.brand || "Annai Jewellery"}</p></td><td className="px-4 py-3 text-slate-600">{product.category}</td><td className="px-4 py-3"><p className="font-semibold text-slate-900">₹{product.price.toLocaleString("en-IN")}</p>{discount > 0 && <p className="mt-1 text-[11px] font-medium text-emerald-600">{discount}% off</p>}</td><td className="px-4 py-3"><span className={`font-semibold ${product.stock <= 5 ? "text-red-600" : "text-slate-800"}`}>{product.stock}</span></td><td className="px-4 py-3">{product.badge ? <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-semibold text-amber-800">{product.badge}</span> : <span className="text-slate-300">—</span>}</td><td className="px-4 py-3"><Status value={product.isActive ? "Visible" : "Hidden"} /></td><td className="px-6 py-3"><div className="flex justify-end gap-1"><button disabled={changingVisibility === product.id} onClick={() => toggleVisibility(product)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40" aria-label={`${product.isActive ? "Hide" : "Show"} ${product.name}`}>{changingVisibility === product.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><button onClick={() => setEditing(product)} className="grid h-9 w-9 place-items-center rounded-lg text-amber-700 transition hover:bg-amber-50" aria-label={`Edit ${product.name}`}><Pencil className="h-4 w-4" /></button><button onClick={() => remove(product)} className="grid h-9 w-9 place-items-center rounded-lg text-red-500 transition hover:bg-red-50" aria-label={`Archive ${product.name}`}><Trash2 className="h-4 w-4" /></button></div></td></tr>; })}</tbody>
        </table>
      </div>
      <div className="divide-y divide-amber-100 md:hidden">{filtered.map((product) => <article key={product.id} className="flex gap-3 p-4"><img src={adminAssetUrl(product.image)} alt="" className="h-20 w-20 shrink-0 rounded-xl border border-amber-100 bg-amber-50 object-cover" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="truncate text-sm font-semibold text-slate-900">{product.name}</h2><p className="mt-1 text-[11px] text-slate-500">{product.category}</p></div><Status value={product.isActive ? "Visible" : "Hidden"} /></div><div className="mt-3 flex items-center justify-between"><div><p className="text-sm font-semibold">₹{product.price.toLocaleString("en-IN")}</p><p className="text-[10px] text-slate-400">{product.stock} in stock</p></div><div className="flex"><button disabled={changingVisibility === product.id} onClick={() => toggleVisibility(product)} className="grid h-8 w-8 place-items-center text-slate-600 disabled:opacity-40" aria-label={`${product.isActive ? "Hide" : "Show"} ${product.name}`}>{changingVisibility === product.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><button onClick={() => setEditing(product)} className="grid h-8 w-8 place-items-center text-amber-700"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(product)} className="grid h-8 w-8 place-items-center text-red-500"><Trash2 className="h-4 w-4" /></button></div></div></div></article>)}</div>
      {!filtered.length && <p className="py-14 text-center text-sm text-slate-400">No matching products found.</p>}
      <Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} />
    </>}
    {editing !== undefined && <ProductEditor product={editing} categories={categories} close={() => setEditing(undefined)} saved={() => { setEditing(undefined); load(); }} notify={notify} />}
  </section>;
}

function ProductEditor({ product, categories, close, saved, notify }: { product: AdminProduct | null; categories: AdminCategory[]; close: () => void; saved: () => void; notify: (n: Notice) => void }) {
  const [form, setForm] = useState(() => product ? {
    ...emptyProduct, ...product, price: String(product.price), comparePrice: String(product.comparePrice || ""),
    stock: String(product.stock), rating: String(product.rating), imageUrl: product.imageUrl || product.image,
    images: product.images || [], relatedProductIds: product.relatedProductIds || [],
  } : emptyProduct);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoryItems, setCategoryItems] = useState(categories);
  const [addingCategory, setAddingCategory] = useState(false);
  const [relatedSearch, setRelatedSearch] = useState("");
  const [relatedProducts, setRelatedProducts] = useState<AdminProduct[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setRelatedLoading(true);
      adminApi.products(`page=1&limit=10&search=${encodeURIComponent(relatedSearch.trim())}`)
        .then((result) => { if (active) setRelatedProducts(result.products); })
        .catch((error) => notify({ type: "error", text: `Could not load related products: ${error.message}` }))
        .finally(() => { if (active) setRelatedLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [notify, relatedSearch]);
  const set = (key: string, value: unknown) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setErrors((current) => ({ ...current, imageUrl: "Choose an image smaller than 5 MB." }));
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      const result = await adminApi.uploadImage(dataUrl, "catalog", "product");
      const uploadedImage = result.path || result.url || "";
      if (!form.imageUrl) set("imageUrl", uploadedImage);
      set("images", [...new Set([...form.images, uploadedImage])]);
      notify({ type: "success", text: "Image uploaded." });
    } catch (e) { setErrors((current) => ({ ...current, imageUrl: (e as Error).message })); } finally { setBusy(false); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Enter a product name.";
    if (!form.category) next.category = "Select a category.";
    if (Number(form.price) <= 0) next.price = "Enter a selling price greater than zero.";
    if (Number(form.stock) < 0 || form.stock === "") next.stock = "Enter a valid stock quantity.";
    if (!form.imageUrl) next.imageUrl = "Upload at least one product image.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const storedImages = [...new Set([form.imageUrl, ...form.images].filter(Boolean).map(storedAssetUrl))];
      await adminApi.saveProduct({
        ...form, price: Number(form.price), comparePrice: Number(form.comparePrice || 0), stock: Number(form.stock),
        rating: Number(form.rating), inStock: Number(form.stock) > 0,
        imageUrl: storedAssetUrl(form.imageUrl),
        images: storedImages,
        specs: { ...(product?.specs || {}), relatedProductIds: form.relatedProductIds },
      }, product?.id);
      notify({ type: "success", text: product ? "Product updated." : "Product created." }); saved();
    } catch (e) { notify({ type: "error", text: (e as Error).message }); } finally { setBusy(false); }
  };
  return <><Modal title={product ? "Edit product" : "Add product"} close={close}><form onSubmit={submit} noValidate className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Product name"><input value={form.name} onChange={(e) => set("name", e.target.value)} className={`${inputClass} ${errors.name ? "border-red-400" : ""}`} />{errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name}</span>}</Field><Field label="Category"><select value={form.category} onChange={(e) => { if (e.target.value === "__add_category__") setAddingCategory(true); else set("category", e.target.value); }} className={`${inputClass} ${errors.category ? "border-red-400" : ""}`}><option value="">Select category</option>{categoryItems.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}<option value="__add_category__">＋ Add new category</option></select>{errors.category && <span className="mt-1 block text-xs text-red-600">{errors.category}</span>}</Field><Field label="Selling price"><input min={1} type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className={`${inputClass} ${errors.price ? "border-red-400" : ""}`} />{errors.price && <span className="mt-1 block text-xs text-red-600">{errors.price}</span>}</Field><Field label="Compare price"><input min={0} type="number" value={form.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} className={inputClass} /></Field><Field label="Stock"><input min={0} type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} className={`${inputClass} ${errors.stock ? "border-red-400" : ""}`} />{errors.stock && <span className="mt-1 block text-xs text-red-600">{errors.stock}</span>}</Field><Field label="Badge"><input value={form.badge} onChange={(e) => set("badge", e.target.value)} className={inputClass} placeholder="New / Bestseller" /></Field></div>
    <Field label="Short tagline"><input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputClass} /></Field>
    <Field label="Description"><textarea rows={4} maxLength={1200} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} /></Field>
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-xs font-semibold text-amber-700"><Upload className="h-4 w-4" />{form.imageUrl ? "Upload another product image" : "Upload product image"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} /></label>
    <p className="text-[11px] text-slate-500">Minimum 600 x 600px. Images are optimized to 1200 x 1200px automatically.</p>
    {errors.imageUrl && <p className="text-xs font-medium text-red-600">{errors.imageUrl}</p>}
    {form.imageUrl && <img src={adminAssetUrl(form.imageUrl)} alt="Preview" className="h-40 w-full rounded-2xl bg-amber-50 object-contain" />}
    {form.images.length > 0 && <Field label="Product gallery"><div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{form.images.map((image) => <div key={image} className="relative overflow-hidden rounded-xl border border-amber-100"><img src={adminAssetUrl(image)} alt="" className="h-20 w-full object-cover" /><button type="button" onClick={() => set("images", form.images.filter((item) => item !== image))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-red-600 shadow" aria-label="Remove gallery image"><X className="h-3 w-3" /></button><button type="button" onClick={() => set("imageUrl", image)} className="block w-full bg-white px-1 py-1 text-[9px] font-semibold text-amber-700">{form.imageUrl === image ? "Main image" : "Set main"}</button></div>)}</div></Field>}
    <Field label="Related products"><p className="mb-2 text-xs leading-5 text-slate-500">Search and select products to display with this item. Results are loaded 10 at a time from the server.</p><div className="mb-2 flex items-center gap-2 rounded-xl border border-amber-100 px-3"><Search className="h-4 w-4 text-amber-600" /><input value={relatedSearch} onChange={(event) => setRelatedSearch(event.target.value)} placeholder="Search related products" className="min-w-0 flex-1 py-2.5 text-sm outline-none" /></div><div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-amber-100 p-2">{relatedLoading ? <div className="grid h-24 place-items-center"><LoaderCircle className="h-5 w-5 animate-spin text-amber-600" /></div> : relatedProducts.filter((item) => item.id !== product?.id).map((item) => { const id = String(item.id); const checked = form.relatedProductIds.includes(id); return <label key={id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-amber-50"><input type="checkbox" checked={checked} onChange={() => set("relatedProductIds", checked ? form.relatedProductIds.filter((x) => x !== id) : [...form.relatedProductIds, id].slice(0, 12))} /><img src={item.image} alt="" className="h-9 w-9 rounded-lg object-cover" /><span className="min-w-0 flex-1 truncate text-sm">{item.name}</span><span className="text-xs text-slate-400">{item.category}</span></label>; })}{!relatedLoading && !relatedProducts.length && <p className="py-6 text-center text-xs text-slate-400">No matching products.</p>}</div></Field>
    <div className="flex flex-wrap gap-4"><Toggle label="Visible in store" checked={form.isActive} onChange={(value) => set("isActive", value)} /><Toggle label="Featured product" checked={form.isFeatured} onChange={(value) => set("isFeatured", value)} /></div>
    <div className="flex justify-end"><button disabled={busy} className={buttonClass}>{busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save product</button></div>
  </form></Modal>{addingCategory && <CategoryEditor category={null} close={() => setAddingCategory(false)} saved={(created) => { setCategoryItems((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name))); set("category", created.name); setAddingCategory(false); }} notify={notify} />}</>;
}

function CategoryEditor({ category, close, saved, notify }: { category: AdminCategory | null; close: () => void; saved: (category: AdminCategory) => void; notify: (n: Notice) => void }) {
  const [name, setName] = useState(category?.name || "");
  const [imageUrl, setImageUrl] = useState(category?.imageUrl || "");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      const uploaded = await adminApi.uploadImage(dataUrl, "categories", "category");
      setImageUrl(uploaded.path || uploaded.url || "");
      setErrors((current) => ({ ...current, imageUrl: "" }));
    } catch (error) { setErrors((current) => ({ ...current, imageUrl: (error as Error).message })); }
    finally { setBusy(false); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter a category name.";
    if (!imageUrl) next.imageUrl = "Upload a category image.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const payload = { name: name.trim(), imageUrl: storedAssetUrl(imageUrl) };
      const result = category ? await adminApi.updateCategory(category.id, payload) : await adminApi.createCategory(payload);
      notify({ type: "success", text: `Category ${category ? "updated" : "created"}.` });
      saved(result);
    } catch (error) { notify({ type: "error", text: (error as Error).message }); }
    finally { setBusy(false); }
  };
  return <Modal title={category ? "Edit category" : "Add category"} close={close}><form onSubmit={submit} noValidate className="space-y-4">
    <Field label="Category name"><input value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: "" })); }} className={`${inputClass} ${errors.name ? "border-red-400" : ""}`} autoFocus />{errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name}</span>}</Field>
    <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-700"><Upload className="h-3.5 w-3.5" />{imageUrl ? "Replace category image" : "Upload category image"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => upload(event.target.files?.[0])} /></label>
    <p className="text-[11px] text-slate-500">Minimum 400 x 400px. The image is prepared at 640 x 640px.</p>
    {errors.imageUrl && <p className="text-xs font-medium text-red-600">{errors.imageUrl}</p>}
    {imageUrl && <img src={adminAssetUrl(imageUrl)} alt="Category preview" className="h-44 w-full rounded-2xl border border-amber-100 bg-amber-50 object-contain" />}
    <div className="flex justify-end"><button disabled={busy} className={buttonClass}>{busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : category ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}{category ? "Save category" : "Add category"}</button></div>
  </form></Modal>;
}

function CategoryProductsModal({ category, categories, close, notify, changed }: { category: AdminCategory; categories: AdminCategory[]; close: () => void; notify: (n: Notice) => void; changed: () => void }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<number | null>(null);
  const [editing, setEditing] = useState<AdminProduct | null | undefined>(undefined);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        category: category.name,
      });
      if (search.trim()) params.set("search", search.trim());
      const result = await adminApi.products(params.toString());
      setProducts(result.products);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (page > result.totalPages) setPage(Math.max(result.totalPages, 1));
    } catch (error) {
      notify({ type: "error", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [category.name, notify, page, search]);
  useEffect(() => {
    const timer = window.setTimeout(load, 220);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const toggle = async (product: AdminProduct) => {
    setChanging(product.id);
    try {
      await adminApi.productStatus(product.id, { isActive: !product.isActive });
      notify({ type: "success", text: product.isActive ? "Product hidden from the store." : "Product is now visible." });
      await load();
      changed();
    } catch (error) {
      notify({ type: "error", text: (error as Error).message });
    } finally {
      setChanging(null);
    }
  };
  const remove = async (product: AdminProduct) => {
    if (!confirm(`Permanently delete “${product.name}”? This removes it from products, carts and wishlists and cannot be undone.`)) return;
    setChanging(product.id);
    try {
      await adminApi.deleteProductPermanently(product.id);
      notify({ type: "success", text: "Product permanently deleted." });
      await load();
      changed();
    } catch (error) {
      notify({ type: "error", text: (error as Error).message });
    } finally {
      setChanging(null);
    }
  };

  return <><Modal title={`${category.name} products`} subtitle="Manage products in this collection" size="lg" close={close}>
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-[#fffdfa] p-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-amber-100 bg-white px-3 py-2.5 shadow-sm focus-within:border-amber-400">
          <Search className="h-4 w-4 shrink-0 text-amber-600" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search in ${category.name}`} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
          {search && <button type="button" onClick={() => setSearch("")} className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-amber-50 hover:text-amber-700" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
        </label>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">{total} product{total === 1 ? "" : "s"}</span>
          <button type="button" onClick={load} className="grid h-9 w-9 place-items-center rounded-lg border border-amber-100 bg-white text-amber-700 hover:bg-amber-50" aria-label="Refresh products"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {loading ? <Loading /> : <>
        <div className="grid gap-3 md:grid-cols-2">
          {products.map((product) => <article key={product.id} className="group flex min-w-0 gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,.04)] transition hover:border-amber-200 hover:shadow-[0_8px_24px_rgba(92,65,12,.08)]">
            <img src={adminAssetUrl(product.image)} alt="" className="h-20 w-20 shrink-0 rounded-xl border border-amber-100 bg-amber-50 object-cover" />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-800">₹{product.price.toLocaleString("en-IN")}</p>
                </div>
                <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ${product.isActive ? "bg-emerald-500 ring-emerald-50" : "bg-red-500 ring-red-50"}`} title={product.isActive ? "Visible" : "Hidden"} />
              </div>
              <div className="mt-auto flex items-end justify-between gap-2">
                <div className="text-[10px] leading-4 text-slate-400"><span className="block">{product.stock} in stock</span><span className={product.isActive ? "text-emerald-600" : "text-red-500"}>{product.isActive ? "Visible" : "Hidden"}</span></div>
                <div className="flex gap-1 rounded-lg bg-slate-50 p-1">
                  <button disabled={changing === product.id} onClick={() => toggle(product)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-white hover:text-amber-700 hover:shadow-sm disabled:opacity-40" aria-label={`${product.isActive ? "Hide" : "Show"} ${product.name}`}>{changing === product.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : product.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                  <button onClick={() => setEditing(product)} className="grid h-7 w-7 place-items-center rounded-md text-amber-700 transition hover:bg-white hover:shadow-sm" aria-label={`Edit ${product.name}`}><Pencil className="h-3.5 w-3.5" /></button>
                  <button disabled={changing === product.id} onClick={() => remove(product)} className="grid h-7 w-7 place-items-center rounded-md text-red-500 transition hover:bg-white hover:shadow-sm disabled:opacity-40" aria-label={`Delete ${product.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          </article>)}
        </div>
        {!products.length && <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-amber-200 bg-amber-50/30 px-5 text-center text-sm text-slate-400">No products found in this category.</div>}
        <div className="overflow-hidden rounded-xl border border-amber-100 bg-white"><Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} /></div>
      </>}
    </div>
  </Modal>{editing !== undefined && <ProductEditor product={editing} categories={categories} close={() => setEditing(undefined)} saved={() => { setEditing(undefined); load(); changed(); }} notify={notify} />}</>;
}

function CategoriesView({ notify }: { notify: (n: Notice) => void }) {
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [search, setSearch] = useState("");
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const load = useCallback(() => adminApi.categories().then((r) => setItems(r.categories)).catch((e) => notify({ type: "error", text: e.message })), [notify]);
  useEffect(() => { load(); }, [load]);
  const remove = async (item: AdminCategory) => { if (!confirm(`Delete “${item.name}”? Products must be reassigned first.`)) return; try { await adminApi.deleteCategory(item.id); notify({ type: "success", text: "Category deleted." }); load(); } catch (e) { notify({ type: "error", text: (e as Error).message }); } };
  const filteredItems = items.filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <><PageHeader merged title="Categories" subtitle="Select a category to manage all products inside it." action={<button onClick={() => setEditingCategory(null)} className={buttonClass}><Plus className="h-4 w-4" /> Add category</button>} /><section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"><ListToolbar search={search} setSearch={setSearch} placeholder="Search categories" total={filteredItems.length} refresh={load} /><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredItems.map((item) => <article key={item.id} role="button" tabIndex={0} onClick={(event) => { if (!(event.target as HTMLElement).closest("button")) setSelectedCategory(item); }} onKeyDown={(event) => { if (event.key === "Enter") setSelectedCategory(item); }} className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">{item.imageUrl ? <img src={adminAssetUrl(item.imageUrl)} alt="" className="h-16 w-16 rounded-2xl border border-amber-100 object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-700"><Tags className="h-4 w-4" /></span>}<div className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-800">{item.name}</span><span className="mt-1 block text-[11px] text-slate-400">{Number(item.productCount || 0)} products · {Number(item.visibleProductCount || 0)} visible</span><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 opacity-0 transition group-hover:opacity-100">Manage products <ChevronRight className="h-3 w-3" /></span></div><button onClick={() => setEditingCategory(item)} className="grid h-9 w-9 place-items-center rounded-lg text-amber-700 hover:bg-amber-50" aria-label={`Edit ${item.name}`}><Pencil className="h-4 w-4" /></button><button onClick={() => remove(item)} className="grid h-9 w-9 place-items-center rounded-lg text-red-600 hover:bg-red-50" aria-label={`Delete ${item.name}`}><Trash2 className="h-4 w-4" /></button></article>)}</div>{!filteredItems.length && <p className="py-12 text-center text-sm text-slate-400">No matching categories.</p>}</section>{editingCategory !== undefined && <CategoryEditor category={editingCategory} close={() => setEditingCategory(undefined)} saved={() => { setEditingCategory(undefined); load(); }} notify={notify} />}{selectedCategory && <CategoryProductsModal category={selectedCategory} categories={items} close={() => setSelectedCategory(null)} changed={load} notify={notify} />}</>;
}

function OrderTable({ orders, compact = false, select }: { orders: AdminOrder[]; compact?: boolean; select?: (o: AdminOrder) => void }) {
  return <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-amber-100 text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="py-3">Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th>{!compact && <th />}</tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-slate-100 last:border-0"><td className="py-3 font-semibold text-slate-800">{order.orderId}</td><td><p>{order.customerName}</p><p className="text-xs text-slate-400">{order.customerPhone}</p></td><td>₹{order.amount.toLocaleString("en-IN")}</td><td><Status value={order.paymentStatus} /></td><td><Status value={order.status} /></td><td className="text-xs text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}</td>{!compact && <td><button onClick={() => select?.(order)} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">Manage <ChevronRight className="h-3 w-3" /></button></td>}</tr>)}</tbody></table>{!orders.length && <p className="py-10 text-center text-sm text-slate-400">No orders found.</p>}</div>;
}

function OrdersView({ notify }: { notify: (n: Notice) => void }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]); const [search, setSearch] = useState(""); const [selected, setSelected] = useState<AdminOrder | null>(null); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(1);
  const load = useCallback(async () => { setLoading(true); try { const result = await adminApi.orders(`page=${page}&limit=10&search=${encodeURIComponent(search.trim())}`); setOrders(result.orders); setTotal(result.total); setTotalPages(result.totalPages); } catch (e) { notify({ type: "error", text: (e as Error).message }); } finally { setLoading(false); } }, [notify, page, search]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  useEffect(() => { setPage(1); }, [search]);
  const inspect = async (order: AdminOrder) => {
    setSelected(order);
    try { setSelected(await adminApi.order(order.id)); }
    catch (error) { notify({ type: "error", text: (error as Error).message }); }
  };
  const update = async (status: string) => { if (!selected) return; try { const updated = await adminApi.orderStatus(selected.id, status); setSelected(updated); notify({ type: "success", text: "Order status updated." }); load(); } catch (e) { notify({ type: "error", text: (e as Error).message }); } };
  const payment = async (action: "approve" | "reject") => { if (!selected) return; const reason = action === "reject" ? prompt("Reason for rejecting this payment:") || "" : ""; if (action === "reject" && !reason) return; try { const updated = await adminApi.paymentReview(selected.id, action, reason); setSelected(updated); notify({ type: "success", text: `Payment ${action === "approve" ? "approved" : "rejected"}.` }); load(); } catch (e) { notify({ type: "error", text: (e as Error).message }); } };
  const statusOptions = selected ? ({
    Pending: ["Pending", "Processing", "Cancelled"],
    Processing: ["Processing", "Shipped"],
    Shipped: ["Shipped", "Delivered"],
    Delivered: ["Delivered"],
    Cancelled: ["Cancelled"],
  } as Record<string, string[]>)[selected.status] || [selected.status] : [];
  return <><PageHeader merged title="All orders" subtitle="Review every order, payment proof and fulfilment status." /><div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm"><div className="p-4 sm:p-5"><ListToolbar search={search} setSearch={setSearch} placeholder="Order ID, customer, email or phone" total={total} refresh={load} /></div>{loading ? <Loading /> : <div className="px-4 sm:px-6"><OrderTable orders={orders} select={inspect} /></div>}<Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} /></div>
    {selected && <Modal title={selected.orderId} close={() => setSelected(null)}>
      <div className="space-y-5 text-sm">
        <div className="grid gap-3 rounded-2xl bg-amber-50 p-4 sm:grid-cols-2">
          <Info label="Customer" value={selected.customerName} />
          <Info label="Phone" value={selected.customerPhone} />
          <Info label="Email" value={selected.customerEmail || "—"} />
          <Info label="Total" value={`₹${selected.amount.toLocaleString("en-IN")}`} />
          <Info label="Payment" value={selected.paymentStatus} />
          <Info label="Order status" value={selected.status} />
        </div>
        <div className="rounded-xl border border-amber-100 bg-white p-3">
          <Field label="Update fulfilment status">
            <select value={selected.status} onChange={(event) => update(event.target.value)} className={inputClass}>
              {statusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
          </Field>
        </div>
        {selected.items?.length ? <section>
          <h3 className="mb-3 font-semibold text-slate-900">Order items</h3>
          <div className="space-y-2">{selected.items.map((item) => <article key={item.id} className="flex items-center gap-3 rounded-xl border border-amber-100 p-3">
            {item.productSnapshot?.image && <img src={item.productSnapshot.image} alt="" className="h-14 w-14 rounded-lg object-cover" />}
            <div className="min-w-0 flex-1"><p className="truncate font-medium">{item.productName}</p><p className="text-xs text-slate-400">{item.sku || "Standard"} · Qty {item.quantity}</p></div>
            <strong>₹{item.lineTotal.toLocaleString("en-IN")}</strong>
          </article>)}</div>
        </section> : <Info label="Products" value={selected.product} />}
        <Info label="Delivery address" value={selected.deliveryAddress || "—"} />
        {selected.paymentStatus === "Awaiting Verification" && <div className="grid grid-cols-2 gap-3">
          <button onClick={() => payment("approve")} className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white">Approve payment</button>
          <button onClick={() => payment("reject")} className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white">Reject payment</button>
        </div>}
        {selected.paymentProofUrl && <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer payment screenshot</p>
          <a href={`${API_BASE_URL.replace(/\/api$/, "")}${selected.paymentProofUrl}`} target="_blank" rel="noreferrer">
            <img src={`${API_BASE_URL.replace(/\/api$/, "")}${selected.paymentProofUrl}`} alt="Customer payment proof" className="max-h-[48dvh] w-full rounded-2xl border border-amber-100 bg-slate-50 object-contain sm:max-h-80" />
          </a>
        </div>}
      </div>
    </Modal>}
  </>;
}

const emptyReview = { name: "", role: "Annai Customer", rating: 5, text: "", imageUrl: "", productId: null as number | null, source: "Website", reviewDate: "", isVisible: true };
function ReviewsView({ notify }: { notify: (n: Notice) => void }) {
  const [reviews, setReviews] = useState<AdminReview[]>([]); const [editing, setEditing] = useState<AdminReview | null | undefined>(undefined);
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(1); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { const result = await adminApi.reviews(`page=${page}&limit=10&search=${encodeURIComponent(search.trim())}`); setReviews(result.testimonials); setTotal(result.total); setTotalPages(result.totalPages); } catch (error) { notify({ type: "error", text: (error as Error).message }); } finally { setLoading(false); } }, [notify, page, search]);
  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { setPage(1); }, [search]);
  const remove = async (item: AdminReview) => { if (!confirm(`Delete ${item.name}’s review?`)) return; try { await adminApi.deleteReview(item.id); notify({ type: "success", text: "Review deleted." }); load(); } catch (e) { notify({ type: "error", text: (e as Error).message }); } };
  return <><PageHeader merged title="Reviews" subtitle="Add, edit, publish and moderate customer feedback." action={<button onClick={() => setEditing(null)} className={buttonClass}><Plus className="h-4 w-4" /> Add review</button>} /><section className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm"><div className="p-4 sm:p-5"><ListToolbar search={search} setSearch={setSearch} placeholder="Search customer, product or review" total={total} refresh={load} /></div>{loading ? <Loading /> : <div className="grid gap-4 px-4 pb-5 md:grid-cols-2 xl:grid-cols-3 sm:px-5">{reviews.map((item) => <article key={item.id} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-400">{item.role}</p></div><Status value={item.isVisible ? "Visible" : "Hidden"} /></div><div className="my-3 flex text-amber-500">{Array.from({ length: item.rating }, (_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div><p className="line-clamp-4 text-sm leading-6 text-slate-600">{item.text}</p><div className="mt-4 flex justify-end gap-2"><button onClick={() => adminApi.reviewVisible(item.id, !item.isVisible).then(load)} className="p-2 text-slate-500">{item.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><button onClick={() => setEditing(item)} className="p-2 text-amber-700"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(item)} className="p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div></article>)}</div>}<Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} /></section>{editing !== undefined && <ReviewEditor review={editing} close={() => setEditing(undefined)} saved={() => { setEditing(undefined); load(); }} notify={notify} />}</>;
}

function ReviewEditor({ review, close, saved, notify }: { review: AdminReview | null; close: () => void; saved: () => void; notify: (n: Notice) => void }) {
  const [form, setForm] = useState<AdminReview | typeof emptyReview>(review || emptyReview); const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      adminApi.products(`page=1&limit=10&search=${encodeURIComponent(productSearch.trim())}`)
        .then((result) => setProducts(result.products))
        .catch((error) => notify({ type: "error", text: `Could not load products: ${error.message}` }));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [notify, productSearch]);
  const set = (key: string, value: unknown) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Enter the customer name.";
    if (!form.text.trim()) next.text = "Enter the review.";
    if (Object.keys(next).length) return setErrors(next);
    setErrors({});
    setBusy(true);
    try { await adminApi.saveReview(form, review?.id); notify({ type: "success", text: "Review saved." }); saved(); }
    catch (reason) { notify({ type: "error", text: (reason as Error).message }); }
    finally { setBusy(false); }
  };
  return <Modal title={review ? "Edit review" : "Add review"} close={close}><form onSubmit={submit} noValidate className="space-y-4"><Field label="Product"><input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products (10 results)" className={`${inputClass} mb-2`} /><select value={form.productId || ""} onChange={(e) => set("productId", e.target.value ? Number(e.target.value) : null)} className={inputClass}><option value="">Store-wide review</option>{form.productId && !products.some((product) => product.id === form.productId) && <option value={form.productId}>Selected product #{form.productId}</option>}{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field><Field label="Customer name"><input value={form.name} onChange={(e) => set("name", e.target.value)} className={`${inputClass} ${errors.name ? "border-red-400" : ""}`} />{errors.name && <span className="mt-1.5 block text-xs font-medium text-red-600">{errors.name}</span>}</Field><div className="grid grid-cols-2 gap-4"><Field label="Customer label"><input value={form.role} onChange={(e) => set("role", e.target.value)} className={inputClass} /></Field><Field label="Rating"><select value={form.rating} onChange={(e) => set("rating", Number(e.target.value))} className={inputClass}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></Field></div><Field label="Review"><textarea rows={5} value={form.text} onChange={(e) => set("text", e.target.value)} className={`${inputClass} ${errors.text ? "border-red-400" : ""}`} />{errors.text && <span className="mt-1.5 block text-xs font-medium text-red-600">{errors.text}</span>}</Field><Field label="Review date"><input value={form.reviewDate || ""} onChange={(e) => set("reviewDate", e.target.value)} className={inputClass} placeholder="July 2026" /></Field><Toggle label="Publish on storefront" checked={form.isVisible} onChange={(isVisible) => set("isVisible", isVisible)} /><button disabled={busy} className={`${buttonClass} w-full`}><Save className="h-4 w-4" /> Save review</button></form></Modal>;
}

function CustomersView({ notify }: { notify: (n: Notice) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [wishlist, setWishlist] = useState<AdminProduct[]>([]);
  const [cart, setCart] = useState<AdminCartItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.users(`page=${page}&limit=10&search=${encodeURIComponent(search.trim())}`);
      setUsers(result.users); setTotal(result.total); setTotalPages(result.totalPages);
    } catch (error) { notify({ type: "error", text: (error as Error).message }); }
    finally { setLoading(false); }
  }, [notify, page, search]);
  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { setPage(1); }, [search]);
  const inspect = async (user: AdminUser) => {
    setSelected(user); setLoadingDetails(true);
    try {
      const [orderRows, wishlistRows, cartRows] = await Promise.all([adminApi.userOrders(user.id), adminApi.userWishlist(user.id), adminApi.userCart(user.id)]);
      setOrders(orderRows); setWishlist(wishlistRows.products); setCart(cartRows.items);
    } catch (error) { notify({ type: "error", text: (error as Error).message }); }
    finally { setLoadingDetails(false); }
  };
  const toggle = async (user: AdminUser) => {
    try {
      await adminApi.userStatus(user.id, !user.isActive);
      notify({ type: "success", text: `Customer ${user.isActive ? "deactivated" : "activated"}.` });
      setSelected(null); load();
    } catch (error) { notify({ type: "error", text: (error as Error).message }); }
  };
  return <><PageHeader merged title="Customers" subtitle="View customer profiles, orders and saved jewellery." />
    <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
      <div className="p-4 sm:p-5"><ListToolbar search={search} setSearch={setSearch} placeholder="Search name, email or phone" total={total} refresh={load} /></div>
      {loading ? <Loading /> : <div className="overflow-x-auto px-4 sm:px-6"><table className="w-full min-w-[680px] text-left text-sm"><thead className="text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="py-3">Customer</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Status</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-slate-100"><td className="py-4"><p className="font-semibold text-slate-800">{user.name}</p><p className="text-xs text-slate-400">{user.email}</p></td><td>{user.phone || "—"}</td><td>{user.orderCount}</td><td>₹{user.totalSpent.toLocaleString("en-IN")}</td><td><Status value={user.isActive ? "Active" : "Inactive"} /></td><td><button onClick={() => inspect(user)} className="text-xs font-semibold text-amber-700">View details</button></td></tr>)}</tbody></table></div>}
      <Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} />
    </div>
    {selected && <Modal title={selected.name} close={() => setSelected(null)}>{loadingDetails ? <Loading /> : <div className="space-y-6"><div className="grid gap-4 rounded-2xl bg-amber-50 p-4 sm:grid-cols-2"><Info label="Email" value={selected.email} /><Info label="Phone" value={selected.phone || "—"} /><Info label="Address" value={selected.address || "—"} /><Info label="Member since" value={selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-IN") : "—"} /></div><section><h3 className="font-semibold text-slate-900">Orders ({orders.length})</h3><OrderTable orders={orders} compact /></section><section><h3 className="font-semibold text-slate-900">Current cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})</h3><div className="mt-3 space-y-2">{cart.map(({ product, quantity }) => <article key={product.id} className="flex items-center gap-3 rounded-xl border border-amber-100 p-2"><img src={product.image} alt="" className="h-14 w-14 rounded-lg object-cover" /><p className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</p><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Qty {quantity}</span></article>)}</div>{!cart.length && <p className="mt-2 text-sm text-slate-400">Cart is empty.</p>}</section><section><h3 className="font-semibold text-slate-900">Wishlist ({wishlist.length})</h3><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{wishlist.map((product) => <article key={product.id} className="overflow-hidden rounded-xl border border-amber-100"><img src={product.image} alt="" className="h-24 w-full object-cover" /><p className="truncate p-2 text-xs font-medium">{product.name}</p></article>)}</div>{!wishlist.length && <p className="mt-2 text-sm text-slate-400">No saved products.</p>}</section><button onClick={() => toggle(selected)} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${selected.isActive ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{selected.isActive ? "Deactivate customer" : "Activate customer"}</button></div>}</Modal>}
  </>;
}

const emptyCoupon = { code: "", title: "", discountType: "percentage" as const, discountValue: 10, minOrderAmount: 0, maxDiscount: 0, validFrom: "", validTo: "", usageLimit: 0, perUserLimit: 1, isActive: true };
function CouponsView({ notify }: { notify: (n: Notice) => void }) {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [editing, setEditing] = useState<AdminCoupon | null | undefined>(undefined);
  const [usage, setUsage] = useState<AdminCouponUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(1); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { const result = await adminApi.coupons(`page=${page}&limit=10&search=${encodeURIComponent(search.trim())}`); setCoupons(result.coupons); setTotal(result.total); setTotalPages(result.totalPages); } catch (error) { notify({ type: "error", text: (error as Error).message }); } finally { setLoading(false); } }, [notify, page, search]);
  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { setPage(1); }, [search]);
  const deactivate = async (coupon: AdminCoupon) => {
    try { await adminApi.deleteCoupon(coupon.id); notify({ type: "success", text: "Coupon deactivated." }); load(); }
    catch (error) { notify({ type: "error", text: (error as Error).message }); }
  };
  const inspectUsage = async (coupon: AdminCoupon) => {
    setUsageLoading(true);
    try { setUsage(await adminApi.couponUsage(coupon.id)); }
    catch (error) { notify({ type: "error", text: (error as Error).message }); }
    finally { setUsageLoading(false); }
  };
  return <><PageHeader merged title="Coupon codes" subtitle="Create discounts and control limits, dates and customer usage." action={<button onClick={() => setEditing(null)} className={buttonClass}><Plus className="h-4 w-4" /> Add coupon</button>} />
    <section className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm"><div className="p-4 sm:p-5"><ListToolbar search={search} setSearch={setSearch} placeholder="Search coupon code or title" total={total} refresh={load} /></div>{loading ? <Loading /> : <div className="grid gap-4 px-4 pb-5 md:grid-cols-2 xl:grid-cols-3 sm:px-5">{coupons.map((coupon) => <article key={coupon.id} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-2 font-mono font-bold text-amber-800">{coupon.code}</span><Status value={coupon.isActive ? "Active" : "Inactive"} /></div><h2 className="mt-4 font-semibold text-slate-900">{coupon.title}</h2><p className="mt-1 text-sm text-slate-500">{coupon.discountType === "percentage" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`} · Minimum ₹{coupon.minOrderAmount}</p><button type="button" disabled={usageLoading} onClick={() => inspectUsage(coupon)} className="mt-3 rounded-full bg-amber-50 px-3 py-1.5 text-left text-xs font-semibold text-amber-800">{coupon.customerCount || 0} customers · {coupon.usageCount || 0} orders{coupon.usageLimit ? ` of ${coupon.usageLimit}` : ""}</button><div className="mt-4 flex justify-end gap-2"><button onClick={() => setEditing(coupon)} className="p-2 text-amber-700" aria-label={`Edit ${coupon.code}`}><Pencil className="h-4 w-4" /></button>{coupon.isActive && <button onClick={() => deactivate(coupon)} className="p-2 text-red-600" aria-label={`Deactivate ${coupon.code}`}><Trash2 className="h-4 w-4" /></button>}</div></article>)}</div>}<Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} /></section>
    {editing !== undefined && <CouponEditor coupon={editing} close={() => setEditing(undefined)} saved={() => { setEditing(undefined); load(); }} notify={notify} />}
    {usage && <Modal title={`${usage.coupon.code} customers`} close={() => setUsage(null)}><div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><Info label="Customers" value={String(usage.customerCount)} /><Info label="Successful orders" value={String(usage.orderCount)} /><Info label="Discount" value={usage.coupon.discountType === "percentage" ? `${usage.coupon.discountValue}%` : `₹${usage.coupon.discountValue}`} /></div><div className="overflow-x-auto rounded-2xl border border-amber-100"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-amber-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Customer</th><th>Contact</th><th>Orders</th><th>Discount received</th><th>Last used</th></tr></thead><tbody>{usage.customers.map((customer) => <tr key={customer.email || customer.phone || customer.name} className="border-t border-amber-100"><td className="px-4 py-3 font-semibold">{customer.name}</td><td className="py-3"><p>{customer.phone || "—"}</p><p className="text-xs text-slate-500">{customer.email || "—"}</p></td><td className="py-3">{customer.orderCount}</td><td className="py-3">₹{customer.totalDiscount.toLocaleString("en-IN")}</td><td className="py-3">{customer.lastUsedAt ? new Date(customer.lastUsedAt).toLocaleDateString("en-IN") : "—"}</td></tr>)}</tbody></table>{!usage.customers.length&&<p className="p-8 text-center text-sm text-slate-500">No successful orders have used this coupon yet.</p>}</div></div></Modal>}
  </>;
}

function CouponEditor({ coupon, close, saved, notify }: { coupon: AdminCoupon | null; close: () => void; saved: () => void; notify: (n: Notice) => void }) {
  const [form, setForm] = useState(coupon ? { ...emptyCoupon, ...coupon } : emptyCoupon);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: string, value: unknown) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!/^[A-Z0-9_-]{3,40}$/.test(form.code.trim())) next.code = "Use 3–40 letters, numbers, underscores or hyphens.";
    if (!form.title.trim()) next.title = "Enter the coupon title.";
    if (Number(form.discountValue) < 1) next.discountValue = "Discount value must be at least 1.";
    if (form.discountType === "percentage" && Number(form.discountValue) > 100) next.discountValue = "Percentage discount cannot exceed 100.";
    for (const key of ["minOrderAmount", "usageLimit", "perUserLimit"] as const) {
      if (Number(form[key]) < 0) next[key] = "Value cannot be negative.";
    }
    if (form.validFrom && form.validTo && new Date(form.validTo) < new Date(form.validFrom)) next.validTo = "End date must be after the start date.";
    if (Object.keys(next).length) return setErrors(next);
    setErrors({});
    setBusy(true);
    try { await adminApi.saveCoupon(form, coupon?.id); notify({ type: "success", text: "Coupon saved." }); saved(); }
    catch (error) { notify({ type: "error", text: (error as Error).message }); }
    finally { setBusy(false); }
  };
  const couponField = (key: string, input: ReactNode) => <Field label={({ code: "Coupon code", title: "Title", discountValue: "Discount value", minOrderAmount: "Minimum order", usageLimit: "Total usage limit", perUserLimit: "Per customer limit", validTo: "Valid until" } as Record<string, string>)[key]}>{input}{errors[key] && <span className="mt-1.5 block text-xs font-medium text-red-600">{errors[key]}</span>}</Field>;
  return <Modal title={coupon ? "Edit coupon" : "Add coupon"} close={close}><form onSubmit={submit} noValidate className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">{couponField("code", <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} className={`${inputClass} ${errors.code ? "border-red-400" : ""}`} />)}{couponField("title", <input value={form.title} onChange={(e) => set("title", e.target.value)} className={`${inputClass} ${errors.title ? "border-red-400" : ""}`} />)}<Field label="Discount type"><select value={form.discountType} onChange={(e) => set("discountType", e.target.value as "percentage" | "flat")} className={inputClass}><option value="percentage">Percentage</option><option value="flat">Flat amount</option></select></Field>{couponField("discountValue", <input type="number" max={form.discountType === "percentage" ? 100 : undefined} value={form.discountValue} onChange={(e) => set("discountValue", Number(e.target.value))} className={`${inputClass} ${errors.discountValue ? "border-red-400" : ""}`} />)}{couponField("minOrderAmount", <input type="number" value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", Number(e.target.value))} className={`${inputClass} ${errors.minOrderAmount ? "border-red-400" : ""}`} />)}{couponField("usageLimit", <input type="number" value={form.usageLimit} onChange={(e) => set("usageLimit", Number(e.target.value))} className={`${inputClass} ${errors.usageLimit ? "border-red-400" : ""}`} />)}{couponField("perUserLimit", <input type="number" value={form.perUserLimit} onChange={(e) => set("perUserLimit", Number(e.target.value))} className={`${inputClass} ${errors.perUserLimit ? "border-red-400" : ""}`} />)}<Field label="Valid from"><input type="datetime-local" value={form.validFrom || ""} onChange={(e) => set("validFrom", e.target.value)} className={inputClass} /></Field>{couponField("validTo", <input type="datetime-local" value={form.validTo || ""} onChange={(e) => set("validTo", e.target.value)} className={`${inputClass} ${errors.validTo ? "border-red-400" : ""}`} />)}</div><Toggle label="Coupon active" checked={form.isActive} onChange={(value) => set("isActive", value)} /><button disabled={busy} className={`${buttonClass} w-full`}><Save className="h-4 w-4" /> Save coupon</button></form></Modal>;
}

const newHomeBanner = (): HomeBanner => ({
  id: crypto.randomUUID(),
  title: "",
  accent: "",
  text: "",
  imageUrl: "",
  mobileImageUrl: "",
  position: "center",
  primaryLabel: "Explore Collections",
  primaryLink: "/collection/products",
  secondaryLabel: "Call Us",
  secondaryLink: "tel:+919751229418",
  isActive: true,
});

function HomeBannersView({ notify }: { notify: (n: Notice) => void }) {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    adminApi.contentBlocks().then(({ blocks }) => {
      const found = blocks.find((block) => block.block_key === "home_banners");
      if (!found) return;
      setEnabled(found.isActive);
      try {
        const parsed = JSON.parse(found.body || "{}");
        if (Array.isArray(parsed.banners)) setBanners(parsed.banners);
      } catch {
        notify({ type: "error", text: "The saved banner configuration could not be read." });
      }
    }).catch((error) => notify({ type: "error", text: error.message }));
  }, [notify]);

  const update = (index: number, patch: Partial<HomeBanner>) => {
    setBanners((current) => current.map((banner, itemIndex) => itemIndex === index ? { ...banner, ...patch } : banner));
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${index}.`))));
  };
  const move = (index: number, direction: number) => {
    const destination = index + direction;
    if (destination < 0 || destination >= banners.length) return;
    setBanners((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };
  const upload = async (index: number, file: File | undefined, mobile: boolean) => {
    if (!file) return;
    const key = `${index}.${mobile ? "mobileImageUrl" : "imageUrl"}`;
    setUploading(key);
    try {
      const result = await adminApi.uploadImage(await fileAsDataUrl(file), "banners", mobile ? "banner-mobile" : "banner-desktop");
      update(index, mobile ? { mobileImageUrl: result.path } : { imageUrl: result.path });
      notify({ type: "success", text: `${mobile ? "Mobile" : "Desktop"} banner prepared at ${result.width} x ${result.height}px.` });
    } catch (error) {
      setErrors((current) => ({ ...current, [key]: (error as Error).message }));
    } finally {
      setUploading("");
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!banners.length) next.general = "Add at least one banner.";
    if (banners.length > 4) next.general = "A maximum of four banners is allowed.";
    banners.forEach((banner, index) => {
      if (!banner.title.trim()) next[`${index}.title`] = "Enter the main heading.";
      else if (banner.title.length > 36) next[`${index}.title`] = "Use 36 characters or less.";
      if (banner.accent.length > 42) next[`${index}.accent`] = "Use 42 characters or less.";
      if (banner.text.length > 90) next[`${index}.text`] = "Use 90 characters or less.";
      if (!banner.imageUrl) next[`${index}.imageUrl`] = "Upload a desktop banner image.";
      if (banner.primaryLabel.length > 24) next[`${index}.primaryLabel`] = "Use 24 characters or less.";
      if (banner.secondaryLabel.length > 20) next[`${index}.secondaryLabel`] = "Use 20 characters or less.";
      if (banner.primaryLink.length > 200) next[`${index}.primaryLink`] = "The link is too long.";
      if (banner.secondaryLink.length > 200) next[`${index}.secondaryLink`] = "The link is too long.";
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await adminApi.saveContentBlock("home_banners", {
        title: "Home carousel",
        body: JSON.stringify({ banners }),
        isActive: enabled,
      });
      notify({ type: "success", text: "Home banners published." });
    } catch (error) {
      notify({ type: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return <><PageHeader merged title="Home banners" subtitle="Manage up to four carousel slides. Uploaded artwork is resized and cropped automatically." action={<button type="button" disabled={banners.length >= 4} onClick={() => setBanners((current) => [...current, newHomeBanner()])} className={buttonClass}><Plus className="h-3.5 w-3.5" /> Add banner</button>} />
    <form onSubmit={save} noValidate className="space-y-5 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
        <div><p className="text-sm font-semibold text-slate-900">Home carousel</p><p className="mt-1 text-xs text-slate-500">Desktop output: 1920 x 1080. Mobile output: 1080 x 1350.</p></div>
        <Toggle label="Show banners on storefront" checked={enabled} onChange={setEnabled} />
      </div>
      {errors.general && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-700">{errors.general}</p>}
      {banners.map((banner, index) => <article key={banner.id} className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50/40 px-4 py-3">
          <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-amber-600 text-xs font-bold text-white">{index + 1}</span><strong className="text-sm text-slate-800">{banner.title || "New banner"}</strong><Status value={banner.isActive ? "Active" : "Inactive"} /></div>
          <div className="flex items-center gap-1"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="rounded-lg border border-amber-100 px-2.5 py-1.5 text-[10px] font-semibold disabled:opacity-30">Move up</button><button type="button" disabled={index === banners.length - 1} onClick={() => move(index, 1)} className="rounded-lg border border-amber-100 px-2.5 py-1.5 text-[10px] font-semibold disabled:opacity-30">Move down</button><button type="button" onClick={() => setBanners((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50" aria-label={`Remove banner ${index + 1}`}><Trash2 className="h-4 w-4" /></button></div>
        </header>
        <div className="grid gap-5 p-4 xl:grid-cols-[1fr_.85fr]">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <Field label={`Main heading (${banner.title.length}/36)`}><input maxLength={36} value={banner.title} onChange={(event) => update(index, { title: event.target.value })} className={`${inputClass} ${errors[`${index}.title`] ? "border-red-400" : ""}`} />{errors[`${index}.title`] && <span className="mt-1 block text-xs text-red-600">{errors[`${index}.title`]}</span>}</Field>
            <Field label={`Gold accent (${banner.accent.length}/42)`}><input maxLength={42} value={banner.accent} onChange={(event) => update(index, { accent: event.target.value })} className={`${inputClass} ${errors[`${index}.accent`] ? "border-red-400" : ""}`} />{errors[`${index}.accent`] && <span className="mt-1 block text-xs text-red-600">{errors[`${index}.accent`]}</span>}</Field>
            <div className="sm:col-span-2"><Field label={`Short description (${banner.text.length}/90)`}><textarea maxLength={90} rows={2} value={banner.text} onChange={(event) => update(index, { text: event.target.value })} className={`${inputClass} ${errors[`${index}.text`] ? "border-red-400" : ""}`} />{errors[`${index}.text`] && <span className="mt-1 block text-xs text-red-600">{errors[`${index}.text`]}</span>}</Field></div>
            <Field label={`Primary button (${banner.primaryLabel.length}/24)`}><input maxLength={24} value={banner.primaryLabel} onChange={(event) => update(index, { primaryLabel: event.target.value })} className={inputClass} />{errors[`${index}.primaryLabel`] && <span className="mt-1 block text-xs text-red-600">{errors[`${index}.primaryLabel`]}</span>}</Field>
            <Field label="Primary destination"><input maxLength={200} value={banner.primaryLink} onChange={(event) => update(index, { primaryLink: event.target.value })} className={inputClass} placeholder="/collection/products" />{errors[`${index}.primaryLink`] && <span className="mt-1 block text-xs text-red-600">{errors[`${index}.primaryLink`]}</span>}</Field>
            <Field label={`Secondary button (${banner.secondaryLabel.length}/20)`}><input maxLength={20} value={banner.secondaryLabel} onChange={(event) => update(index, { secondaryLabel: event.target.value })} className={inputClass} /></Field>
            <Field label="Secondary destination"><input maxLength={200} value={banner.secondaryLink} onChange={(event) => update(index, { secondaryLink: event.target.value })} className={inputClass} placeholder="tel:+919751229418" /></Field>
            <Field label="Image focal point"><select value={banner.position} onChange={(event) => update(index, { position: event.target.value })} className={inputClass}><option value="center">Centre</option><option value="center 35%">Upper centre</option><option value="center 65%">Lower centre</option><option value="left center">Left</option><option value="right center">Right</option></select></Field>
            <div className="flex items-end pb-2"><Toggle label="Banner active" checked={banner.isActive} onChange={(isActive) => update(index, { isActive })} /></div>
          </div>
          <div className="space-y-3">
            <div className="aspect-video overflow-hidden rounded-xl border border-amber-100 bg-slate-100">{banner.imageUrl ? <img src={adminAssetUrl(banner.imageUrl)} alt="" className="h-full w-full object-cover" style={{ objectPosition: banner.position }} /> : <div className="grid h-full place-items-center text-xs text-slate-400">Desktop preview</div>}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-700"><Upload className="h-4 w-4" />{uploading === `${index}.imageUrl` ? "Preparing..." : banner.imageUrl ? "Replace desktop image" : "Upload desktop image"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => upload(index, event.target.files?.[0], false)} /></label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-700"><Upload className="h-4 w-4" />{uploading === `${index}.mobileImageUrl` ? "Preparing..." : banner.mobileImageUrl ? "Replace mobile image" : "Upload mobile image"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => upload(index, event.target.files?.[0], true)} /></label>
            </div>
            {errors[`${index}.imageUrl`] && <p className="text-xs font-medium text-red-600">{errors[`${index}.imageUrl`]}</p>}
            {errors[`${index}.mobileImageUrl`] && <p className="text-xs font-medium text-red-600">{errors[`${index}.mobileImageUrl`]}</p>}
            <p className="text-[11px] leading-5 text-slate-500">Use a clear landscape source of at least 1200 x 675px. Optional mobile artwork must be at least 720 x 900px. Both are optimized automatically.</p>
          </div>
        </div>
      </article>)}
      {!banners.length && <button type="button" onClick={() => setBanners([newHomeBanner()])} className="grid min-h-48 w-full place-items-center rounded-2xl border border-dashed border-amber-300 bg-white text-sm font-semibold text-amber-700"><span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" />Create the first banner</span></button>}
      <div className="sticky bottom-4 flex justify-end"><button disabled={busy || Boolean(uploading)} className={buttonClass}><Save className="h-4 w-4" />{busy ? "Publishing..." : "Publish banners"}</button></div>
    </form>
  </>;
}

function PopupView({ notify }: { notify: (n: Notice) => void }) {
  const [block, setBlock] = useState<ContentBlock>({ block_key: "home_popup", title: "Welcome offer", body: "{}", isActive: true });
  const [form, setForm] = useState({ imageUrl: "", alt: "Annai Jewellery promotion", delaySeconds: 2 });
  const [busy, setBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  useEffect(() => {
    adminApi.contentBlocks().then(({ blocks }) => {
      const found = blocks.find((item) => item.block_key === "home_popup");
      if (!found) return;
      setBlock(found);
      try {
        const saved = JSON.parse(found.body || "{}");
        setForm((current) => ({
          imageUrl: typeof saved.imageUrl === "string" ? storedAssetUrl(saved.imageUrl) : current.imageUrl,
          alt: typeof saved.alt === "string" ? saved.alt : current.alt,
          delaySeconds: Number.isFinite(Number(saved.delaySeconds)) ? Number(saved.delaySeconds) : current.delaySeconds,
        }));
      } catch {
        /* keep safe defaults */
      }
    }).catch((error) => notify({ type: "error", text: error.message }));
  }, [notify]);
  const upload = async (file?: File) => {
    if (!file) return;
    setImageError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setImageError("Choose a PNG, JPG or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Popup image must be under 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const result = await adminApi.uploadImage(await fileAsDataUrl(file), "promotions");
      const imageUrl = storedAssetUrl(result.path || result.url || "");
      if (!imageUrl.startsWith("/uploads/promotions/")) throw new Error("The popup image was uploaded, but its saved path is invalid.");
      setForm((current) => ({ ...current, imageUrl }));
      notify({ type: "success", text: "Popup image uploaded and ready to publish." });
    } catch (reason) {
      setImageError(reason instanceof Error ? reason.message : "Unable to upload the popup image.");
    } finally {
      setBusy(false);
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setImageError("");
    const imageUrl = storedAssetUrl(form.imageUrl);
    if (!imageUrl.startsWith("/uploads/promotions/")) {
      setImageError("Upload a popup image before publishing.");
      return;
    }
    setBusy(true);
    try {
      await adminApi.saveContentBlock("home_popup", {
        title: block.title,
        body: JSON.stringify({ ...form, imageUrl }),
        isActive: block.isActive,
      });
      setForm((current) => ({ ...current, imageUrl }));
      notify({ type: "success", text: "Home popup published." });
    } catch (reason) {
      setImageError(reason instanceof Error ? reason.message : "Unable to publish the popup.");
    } finally {
      setBusy(false);
    }
  };
  return <>
    <PageHeader merged title="Popup advertisement" subtitle="Upload and control the promotional popup shown on the home page." />
    <form onSubmit={save} noValidate className="grid min-w-0 gap-5 rounded-b-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-5 2xl:grid-cols-[minmax(0,1fr)_minmax(22rem,.8fr)]">
      <div className="min-w-0 space-y-4">
        <Field label="Campaign name">
          <input maxLength={80} value={block.title} onChange={(event) => setBlock({ ...block, title: event.target.value })} className={inputClass} />
        </Field>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-5 text-center text-sm font-semibold text-amber-700">
          <Upload className="h-5 w-5 shrink-0" />
          {form.imageUrl ? "Replace popup artwork" : "Upload popup artwork"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
        </label>
        {imageError && <p className="text-xs font-medium text-red-600">{imageError}</p>}
        <p className="text-[11px] leading-5 text-slate-500">Any portrait, square or landscape image is supported. PNG, JPG or WEBP, up to 5 MB. The original aspect ratio is preserved.</p>
        <Field label="Show after seconds">
          <input type="number" min={0} max={30} value={form.delaySeconds} onChange={(event) => setForm({ ...form, delaySeconds: Number(event.target.value) })} className={inputClass} />
        </Field>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Toggle label="Popup enabled" checked={block.isActive} onChange={(isActive) => setBlock({ ...block, isActive })} />
          <button disabled={busy} className={buttonClass}><Save className="h-4 w-4" /> Publish popup</button>
        </div>
      </div>
      <div className="grid min-h-72 min-w-0 place-items-center overflow-hidden rounded-2xl bg-slate-90 p-4 sm:min-h-80 sm:p-5">
        {form.imageUrl
          ? <img src={adminAssetUrl(form.imageUrl)} alt="Popup preview" className="max-h-[32rem] max-w-full rounded-2xl object-contain shadow-2xl" />
          : <p className="text-sm text-white/60">Upload an image to preview it</p>}
      </div>
    </form>
  </>;
}

function SettingsView({ profile, notify }: { profile: AdminProfile; notify: (n: Notice) => void }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.currentPassword) next.currentPassword = "Enter your current password.";
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,72}$/.test(form.newPassword)) {
      next.newPassword = "Use 12–72 characters with uppercase, lowercase, a number and a symbol.";
    }
    if (form.newPassword !== form.confirm) next.confirm = "New passwords do not match.";
    if (Object.keys(next).length) return setPasswordErrors(next);
    setPasswordErrors({});

    setBusy(true);

    try {
      const result = await adminApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      notify({ type: "success", text: result.message });
      setForm({
        currentPassword: "",
        newPassword: "",
        confirm: "",
      });
    } catch (reason) {
      const text = (reason as Error).message;
      if (/current password|incorrect password/i.test(text)) setPasswordErrors({ currentPassword: text });
      else if (/password/i.test(text)) setPasswordErrors({ newPassword: text });
      else notify({ type: "error", text });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        merged
        title="Settings"
        subtitle="Manage the signed-in administrator and account security."
      />

      <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-amber-100 bg-[#fffdfa] p-5">
          <h2 className="font-semibold text-slate-900">Admin account</h2>

          <div className="mt-5 space-y-4">
            <Info label="Name" value="Annai Jewellery" />
            <Info label="Email" value={profile.email} />
            <Info label="Role" value={profile.role} />
          </div>
        </section>

        <form
          onSubmit={submit}
          noValidate
          className="space-y-4 rounded-2xl border border-amber-100 bg-[#fffdfa] p-5"
        >
          <h2 className="font-semibold text-slate-900">
            Change password
          </h2>

          <Field label="Current password">
            <PasswordControl value={form.currentPassword} onChange={(value) => { setForm({ ...form, currentPassword: value }); setPasswordErrors((current) => ({ ...current, currentPassword: "" })); }} error={passwordErrors.currentPassword} autoComplete="current-password" />
          </Field>

          <Field label="New password">
            <PasswordControl value={form.newPassword} onChange={(value) => { setForm({ ...form, newPassword: value }); setPasswordErrors((current) => ({ ...current, newPassword: "" })); }} error={passwordErrors.newPassword} autoComplete="new-password" />
          </Field>

          <Field label="Confirm new password">
            <PasswordControl value={form.confirm} onChange={(value) => { setForm({ ...form, confirm: value }); setPasswordErrors((current) => ({ ...current, confirm: "" })); }} error={passwordErrors.confirm} autoComplete="new-password" />
          </Field>

          <p className="text-xs text-slate-400">
            Use 12–72 characters with uppercase, lowercase, a number and a
            symbol.
          </p>

          <button disabled={busy} className={`${buttonClass} w-full`}>
            <LockKeyhole className="h-4 w-4" />
            Update password
          </button>
        </form>
        </div>
      </div>
    </>
  );
}
function Modal({ title, subtitle, close, children, size = "md" }: { title: string; subtitle?: string; close: () => void; children: ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  const widths = { sm: "max-w-3xl", md: "max-w-5xl", lg: "max-w-6xl", xl: "max-w-[88rem]" };
  const keepDropdownVisible = (event: FocusEvent<HTMLDivElement>) => {
    const control = event.target;
    if (!(control instanceof HTMLSelectElement)) return;
    window.requestAnimationFrame(() => {
      control.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    });
  };
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close]);
  return createPortal(
    <div className="admin-dialog-backdrop bg-slate-950/50 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section role="dialog" aria-modal="true" aria-label={title} className={`admin-dialog-surface w-full overflow-hidden border border-amber-100 border-t-[3px] border-t-amber-400 bg-white shadow-[0_24px_80px_rgba(15,23,42,.28)] ${widths[size]}`}>
        <header className="admin-modal-header flex min-h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold tracking-tight text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-[11px] text-slate-400">{subtitle}</p>}
          </div>
          <button type="button" onClick={close} className="ml-3 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800" aria-label="Close">
            <X className="h-3.5 w-3.5" />
          </button>
        </header>
        <div onFocusCapture={keepDropdownVisible} className="admin-dialog-body admin-modal-body bg-[#fcfbf8] p-4 sm:p-5">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-xs font-semibold text-slate-600"><span className="mb-1.5 block">{label}</span>{children}</label>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) { return <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-amber-600" />{label}</label>; }
function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p><div className="mt-1 break-words text-sm font-medium text-slate-700">{value}</div></div>;
}
function Status({ value }: { value: string }) {
  const normalized = value.trim().toLowerCase();
  const keys: Record<string, string> = {
    pending: "pending", processing: "processing", shipped: "shipped", delivered: "delivered",
    paid: "paid", "awaiting verification": "awaiting", approved: "approved", visible: "visible",
    active: "active", hidden: "hidden", inactive: "inactive", cancelled: "cancelled",
    canceled: "cancelled", rejected: "rejected", failed: "failed", archived: "archived",
    refunded: "refunded",
  };
  return <span className={`admin-status-badge admin-status-${keys[normalized] || "default"}`}>{value}</span>;
}
function Loading() { return <div className="grid min-h-52 place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-amber-600" /></div>; }
function EmptyError({ message }: { message: string }) { return <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">{message}</div>; }

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get("view") as View | null;
  const initialView = requestedView && nav.some(([id]) => id === requestedView) ? requestedView : "dashboard";
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [view, setViewState] = useState<View>(initialView);
  const setView = useCallback((next: View) => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    setViewState(next);
    setSearchParams(next === "dashboard" ? {} : { view: next });
  }, [setSearchParams]);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const notify = useCallback((next: Notice) => {
    if (next?.type === "error" && /admin session|session required|session expired|invalid or expired.*session|token/i.test(next.text)) {
      return;
    }
    setNotice(next);
  }, []);
  useEffect(() => {
    adminApi.profile()
      .then(setProfile)
      .catch((error) => {
        // A missing session or an unavailable API is expected on the
        // frontend-only GitHub Pages preview. Keep the login screen clean.
        if (error instanceof AdminApiError && (error.status === 0 || error.status === 401)) return;
        setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to check the admin session." });
      })
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    const handleExpiredSession = () => {
      setNotice(null);
      setMenu(false);
      setProfile(null);
    };
    window.addEventListener("annai-admin-session-expired", handleExpiredSession);
    return () => window.removeEventListener("annai-admin-session-expired", handleExpiredSession);
  }, []);
  useEffect(() => {
    const next = requestedView && nav.some(([id]) => id === requestedView) ? requestedView : "dashboard";
    setViewState(next);
  }, [requestedView]);
  if (checking) return <main className="grid min-h-screen place-items-center bg-amber-50"><LoaderCircle className="h-8 w-8 animate-spin text-amber-600" /></main>;
  if (!profile) return <><Message notice={notice} clear={() => setNotice(null)} /><AdminLogin onLogin={setProfile} /></>;
  const logout = async () => { try { await adminApi.logout(); } finally { setProfile(null); } };
  const currentLabel = nav.find(([id]) => id === view)?.[1] || "Dashboard";
  return <div className="admin-shell min-h-screen bg-[#f6f3ee] text-slate-800"><Message notice={notice} clear={() => setNotice(null)} />
    {menu && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setMenu(false)} aria-label="Close menu" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-amber-100 bg-white shadow-[6px_0_24px_rgba(77,55,11,.025)] transition-transform lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center justify-center border-b border-amber-100 px-5"><img src={logo} alt="Annai Jewellery" className="h-14 w-auto max-w-[190px] object-contain" /></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">{nav.filter(([id]) => id !== "banners").map(([id, label, Icon]) => <button key={id} onClick={() => { setView(id); setMenu(false); }} className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${view === id ? "bg-amber-50 text-amber-800" : "text-slate-600 hover:bg-[#fffaf0] hover:text-amber-800"}`}>{view === id && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-amber-500" />}<Icon className={`h-[18px] w-[18px] ${view === id ? "text-amber-600" : "text-slate-400"}`} />{label}<ChevronRight className={`ml-auto h-3.5 w-3.5 transition ${view === id ? "opacity-100" : "opacity-0"}`} /></button>)}</nav>
      <div className="border-t border-amber-100 bg-[#fffdfa] p-4"><div className="mb-3 flex items-center gap-3 rounded-xl bg-white p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800"><ShieldCheck className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{profile.name}</p><p className="truncate text-[10px] text-slate-400">{profile.email}</p></div></div><button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"><LogOut className="h-4 w-4" /> Sign out</button></div>
    </aside>
    <div className="lg:pl-[280px]"><header className="sticky top-0 z-20 flex h-[84px] items-center justify-between gap-3 border-b border-amber-100 bg-white px-5 shadow-[0_3px_16px_rgba(77,55,11,.025)] sm:px-7"><div className="flex min-w-0 items-center gap-3"><button onClick={() => setMenu(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-100 bg-white text-slate-700 lg:hidden"><Menu className="h-5 w-5" /></button><div className="min-w-0"><h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Annai Control · {currentLabel}</h1><p className="hidden truncate text-xs text-slate-500 sm:block">{viewDescriptions[view]}</p></div></div><div className="flex shrink-0 items-center gap-2"><button onClick={() => window.location.reload()} className="grid h-10 w-10 place-items-center rounded-xl border border-amber-100 bg-white text-slate-600 transition hover:bg-amber-50 hover:text-amber-700" aria-label="Refresh admin"><RefreshCw className="h-4 w-4" /></button><a href="/" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"><Eye className="h-4 w-4" /><span className="hidden sm:inline">View store</span></a></div></header>
      <main className="mx-auto max-w-[1800px] p-5 sm:p-7 xl:p-8"><div key={view} className="admin-page-enter">{view === "dashboard" && <Dashboard setView={setView} />}{view === "products" && <ProductsView notify={notify} />}{view === "categories" && <CategoriesView notify={notify} />}{view === "orders" && <OrdersView notify={notify} />}{view === "customers" && <CustomersView notify={notify} />}{view === "reviews" && <ReviewsView notify={notify} />}{view === "coupons" && <CouponsView notify={notify} />}{view === "banners" && <HomeBannersView notify={notify} />}{view === "popup" && <PopupView notify={notify} />}{view === "settings" && <SettingsView profile={profile} notify={notify} />}</div></main>
    </div>
  </div>;
}
