import {
  Boxes, ChevronRight, CircleDollarSign, Eye, EyeOff, ImagePlus, LayoutDashboard,
  Loader2 as LoaderCircle, LockKeyhole, LogOut, Menu, Package, Pencil, Plus, ReceiptText,
  RefreshCw, Save, Search, Settings, ShieldCheck, ShoppingBag, Star, Tags, Trash2,
  Upload, Users, X,
} from "lucide-react";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  adminApi, AdminApiError, AdminCategory, AdminOrder, AdminProduct, AdminProfile,
  AdminReview, API_BASE_URL, ContentBlock,
} from "../lib/adminApi";
import logo from "../assets/logo.png";

type View = "dashboard" | "products" | "categories" | "orders" | "reviews" | "popup" | "settings";
type Notice = { type: "success" | "error"; text: string } | null;

const nav: Array<[View, string, typeof LayoutDashboard]> = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["products", "Products", ShoppingBag],
  ["categories", "Categories", Tags],
  ["orders", "All orders", ReceiptText],
  ["reviews", "Reviews", Star],
  ["popup", "Popup advertisement", ImagePlus],
  ["settings", "Settings", Settings],
];

const inputClass = "w-full rounded-xl border border-amber-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8860b] to-[#dfb72d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50";

function Message({ notice, clear }: { notice: Notice; clear: () => void }) {
  if (!notice) return null;
  return <div className={`fixed right-4 top-4 z-[300] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
    <span className="flex-1">{notice.text}</span><button onClick={clear} aria-label="Dismiss"><X className="h-4 w-4" /></button>
  </div>;
}

function AdminLogin({ onLogin }: { onLogin: (profile: AdminProfile) => void }) {
  const [mode, setMode] = useState<"password" | "otp" | "reset">("password");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "password") onLogin(await adminApi.login({ email, password }));
      else if (mode === "otp" && step === "request") {
        const result = await adminApi.requestOtp(email); setMessage(result.message); setStep("verify");
      } else if (mode === "otp") onLogin(await adminApi.verifyOtp(email, otp));
      else if (step === "request") {
        const result = await adminApi.requestReset(email); setMessage(result.message); setStep("verify");
      } else {
        const result = await adminApi.confirmReset({ email, otp, newPassword });
        setMessage(result.message); setMode("password"); setStep("request"); setOtp(""); setNewPassword("");
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to sign in"); }
    finally { setBusy(false); }
  };

  const switchMode = (next: typeof mode) => { setMode(next); setStep("request"); setError(""); setMessage(""); };
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#fff7d6_0,#faf7ef_38%,#f4efe4_100%)] p-4">
    <section className="w-full max-w-md overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-[0_24px_80px_rgba(92,65,12,.15)]">
      <div className="bg-gradient-to-br from-[#fff9e8] to-[#f5e4a3] px-7 py-7 text-center">
        <img src={logo} alt="Annai Jewellery" className="mx-auto h-20 w-auto object-contain" />
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Admin panel</h1>
        <p className="mt-1 text-sm text-slate-600">Secure catalogue and order management</p>
      </div>
      <form onSubmit={submit} className="space-y-4 p-7">
        <div className="grid grid-cols-2 rounded-xl bg-amber-50 p-1 text-xs font-semibold">
          <button type="button" onClick={() => switchMode("password")} className={`rounded-lg px-3 py-2 ${mode === "password" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500"}`}>Password</button>
          <button type="button" onClick={() => switchMode("otp")} className={`rounded-lg px-3 py-2 ${mode === "otp" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500"}`}>Email OTP</button>
        </div>
        <label className="block text-xs font-semibold text-slate-600">Admin email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="admin@annaijewellery.com" /></label>
        {mode === "password" && <label className="block text-xs font-semibold text-slate-600">Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} mt-1.5`} /></label>}
        {mode !== "password" && step === "verify" && <label className="block text-xs font-semibold text-slate-600">6 digit OTP<input inputMode="numeric" pattern="[0-9]{6}" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inputClass} mt-1.5 text-center text-lg tracking-[.35em]`} /></label>}
        {mode === "reset" && step === "verify" && <label className="block text-xs font-semibold text-slate-600">New password<input type="password" minLength={12} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`${inputClass} mt-1.5`} /><span className="mt-1 block font-normal text-slate-400">12+ characters with uppercase, lowercase, number and symbol.</span></label>}
        {message && <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">{message}</p>}
        {error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <button disabled={busy} className={`${buttonClass} w-full`}>{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{mode === "password" ? "Sign in securely" : step === "request" ? "Send email OTP" : mode === "otp" ? "Verify and sign in" : "Reset password"}</button>
        <button type="button" onClick={() => switchMode(mode === "reset" ? "password" : "reset")} className="w-full text-xs font-medium text-amber-700">{mode === "reset" ? "Back to sign in" : "Forgot password?"}</button>
        <p className="text-center text-[11px] text-slate-400">API: {API_BASE_URL}</p>
      </form>
    </section>
  </main>;
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-semibold text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>{action}</header>;
}

function Dashboard({ setView }: { setView: (view: View) => void }) {
  const [data, setData] = useState<{ stats: Record<string, number>; recentOrders: AdminOrder[] } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { adminApi.dashboard().then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <EmptyError message={error} />;
  if (!data) return <Loading />;
  const cards = [
    ["Total orders", data.stats.totalOrders, ReceiptText],
    ["Paid revenue", `₹${Number(data.stats.revenue || 0).toLocaleString("en-IN")}`, CircleDollarSign],
    ["Products", data.stats.products, Package],
    ["Customers", data.stats.totalClients, Users],
    ["Pending orders", data.stats.pendingOrders, ShoppingBag],
    ["Low stock", data.stats.lowStock, Boxes],
  ] as const;
  return <><PageHeader title="Dashboard" subtitle="A live overview of your Annai Jewellery store." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, Icon]) => <article key={label} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? 0}</p></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700"><Icon className="h-5 w-5" /></span></div></article>)}</div>
    <section className="mt-6 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">Recent orders</h2><button onClick={() => setView("orders")} className="text-xs font-semibold text-amber-700">View all</button></div><OrderTable orders={data.recentOrders} compact /></section>
  </>;
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
  const [editing, setEditing] = useState<AdminProduct | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { const [p, c] = await Promise.all([adminApi.products(), adminApi.categories()]); setProducts(p.products); setCategories(c.categories); }
    catch (e) { notify({ type: "error", text: (e as Error).message }); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const remove = async (product: AdminProduct) => {
    if (!confirm(`Archive “${product.name}”?`)) return;
    try { await adminApi.deleteProduct(product.id); notify({ type: "success", text: "Product archived." }); load(); } catch (e) { notify({ type: "error", text: (e as Error).message }); }
  };
  return <><PageHeader title="Products" subtitle={`${products.length} products connected to the storefront.`} action={<button onClick={() => setEditing(null)} className={buttonClass}><Plus className="h-4 w-4" /> Add product</button>} />
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-100 bg-white p-3"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products or categories" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button onClick={load} aria-label="Refresh"><RefreshCw className="h-4 w-4 text-amber-700" /></button></div>
    {loading ? <Loading /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm"><div className="relative aspect-[4/3] bg-amber-50"><img src={product.image} alt="" className="h-full w-full object-cover" /><span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${product.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{product.isActive ? "ACTIVE" : "HIDDEN"}</span></div><div className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-amber-600">{product.category}</p><h2 className="mt-1 line-clamp-1 font-semibold text-slate-900">{product.name}</h2><div className="mt-3 flex items-end justify-between"><div><p className="font-semibold text-slate-900">₹{product.price.toLocaleString("en-IN")}</p><p className="text-xs text-slate-500">{product.stock} in stock · {product.relatedProductIds?.length || 0} related</p></div><div className="flex gap-1"><button onClick={() => setEditing(product)} className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(product)} className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-600" aria-label="Archive"><Trash2 className="h-4 w-4" /></button></div></div></div></article>)}</div>}
    {editing !== undefined && <ProductEditor product={editing} categories={categories} products={products} close={() => setEditing(undefined)} saved={() => { setEditing(undefined); load(); }} notify={notify} />}
  </>;
}

function ProductEditor({ product, categories, products, close, saved, notify }: { product: AdminProduct | null; categories: AdminCategory[]; products: AdminProduct[]; close: () => void; saved: () => void; notify: (n: Notice) => void }) {
  const [form, setForm] = useState(() => product ? {
    ...emptyProduct, ...product, price: String(product.price), comparePrice: String(product.comparePrice || ""),
    stock: String(product.stock), rating: String(product.rating), imageUrl: product.imageUrl || product.image,
    images: product.images || [], relatedProductIds: product.relatedProductIds || [],
  } : emptyProduct);
  const [busy, setBusy] = useState(false);
  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) return notify({ type: "error", text: "Choose an image smaller than 6 MB." });
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      const result = await adminApi.uploadImage(dataUrl);
      set("imageUrl", result.path || result.url); set("images", [...form.images, result.path || result.url]);
      notify({ type: "success", text: "Image uploaded." });
    } catch (e) { notify({ type: "error", text: (e as Error).message }); } finally { setBusy(false); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      await adminApi.saveProduct({
        ...form, price: Number(form.price), comparePrice: Number(form.comparePrice || 0), stock: Number(form.stock),
        rating: Number(form.rating), inStock: Number(form.stock) > 0,
        images: form.images.length ? form.images : [form.imageUrl],
        specs: { ...(product?.specs || {}), relatedProductIds: form.relatedProductIds },
      }, product?.id);
      notify({ type: "success", text: product ? "Product updated." : "Product created." }); saved();
    } catch (e) { notify({ type: "error", text: (e as Error).message }); } finally { setBusy(false); }
  };
  return <Modal title={product ? "Edit product" : "Add product"} close={close}><form onSubmit={submit} className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Product name"><input required minLength={2} value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} /></Field><Field label="Category"><select required value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}><option value="">Select category</option>{categories.map((c) => <option key={c.id}>{c.name}</option>)}</select></Field><Field label="Selling price"><input required min={1} type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className={inputClass} /></Field><Field label="Compare price"><input min={0} type="number" value={form.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} className={inputClass} /></Field><Field label="Stock"><input required min={0} type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} className={inputClass} /></Field><Field label="Badge"><input value={form.badge} onChange={(e) => set("badge", e.target.value)} className={inputClass} placeholder="New / Bestseller" /></Field></div>
    <Field label="Short tagline"><input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputClass} /></Field>
    <Field label="Description"><textarea rows={4} maxLength={1200} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} /></Field>
    <div className="grid gap-4 sm:grid-cols-[1fr_auto]"><Field label="Main image URL"><input required value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} className={inputClass} /></Field><label className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700"><Upload className="h-4 w-4" /> Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} /></label></div>
    {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="h-40 w-full rounded-2xl bg-amber-50 object-contain" />}
    <Field label="Related products"><div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-amber-100 p-2">{products.filter((item) => item.id !== product?.id).map((item) => { const id = String(item.id); const checked = form.relatedProductIds.includes(id); return <label key={id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-amber-50"><input type="checkbox" checked={checked} onChange={() => set("relatedProductIds", checked ? form.relatedProductIds.filter((x) => x !== id) : [...form.relatedProductIds, id].slice(0, 12))} /><img src={item.image} alt="" className="h-9 w-9 rounded-lg object-cover" /><span className="min-w-0 flex-1 truncate text-sm">{item.name}</span><span className="text-xs text-slate-400">{item.category}</span></label>; })}</div></Field>
    <div className="flex flex-wrap gap-4"><Toggle label="Visible in store" checked={form.isActive} onChange={(value) => set("isActive", value)} /><Toggle label="Featured product" checked={form.isFeatured} onChange={(value) => set("isFeatured", value)} /></div>
    <button disabled={busy} className={`${buttonClass} w-full`}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save product</button>
  </form></Modal>;
}

function CategoriesView({ notify }: { notify: (n: Notice) => void }) {
  const [items, setItems] = useState<AdminCategory[]>([]); const [name, setName] = useState(""); const [editing, setEditing] = useState<number | null>(null);
  const load = useCallback(() => adminApi.categories().then((r) => setItems(r.categories)).catch((e) => notify({ type: "error", text: e.message })), [notify]);
  useEffect(() => { load(); }, [load]);
  const submit = async (e: FormEvent) => { e.preventDefault(); try { if (editing) await adminApi.updateCategory(editing, name); else await adminApi.createCategory(name); notify({ type: "success", text: `Category ${editing ? "updated" : "created"}.` }); setName(""); setEditing(null); load(); } catch (reason) { notify({ type: "error", text: (reason as Error).message }); } };
  const remove = async (item: AdminCategory) => { if (!confirm(`Delete “${item.name}”? Products must be reassigned first.`)) return; try { await adminApi.deleteCategory(item.id); notify({ type: "success", text: "Category deleted." }); load(); } catch (e) { notify({ type: "error", text: (e as Error).message }); } };
  return <><PageHeader title="Categories" subtitle="Organise the collection navigation and product catalogue." /><form onSubmit={submit} className="mb-5 flex gap-2 rounded-2xl border border-amber-100 bg-white p-4"><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className={inputClass} /><button className={buttonClass}>{editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editing ? "Save" : "Add"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setName(""); }} className="rounded-xl border px-3"><X className="h-4 w-4" /></button>}</form><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Tags className="h-4 w-4" /></span><span className="flex-1 font-medium text-slate-800">{item.name}</span><button onClick={() => { setEditing(item.id); setName(item.name); }} className="p-2 text-amber-700"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(item)} className="p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></article>)}</div></>;
}

function OrderTable({ orders, compact = false, select }: { orders: AdminOrder[]; compact?: boolean; select?: (o: AdminOrder) => void }) {
  return <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-amber-100 text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="py-3">Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th>{!compact && <th />}</tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-slate-100 last:border-0"><td className="py-3 font-semibold text-slate-800">{order.orderId}</td><td><p>{order.customerName}</p><p className="text-xs text-slate-400">{order.customerPhone}</p></td><td>₹{order.amount.toLocaleString("en-IN")}</td><td><Status value={order.paymentStatus} /></td><td><Status value={order.status} /></td><td className="text-xs text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}</td>{!compact && <td><button onClick={() => select?.(order)} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">Manage <ChevronRight className="h-3 w-3" /></button></td>}</tr>)}</tbody></table>{!orders.length && <p className="py-10 text-center text-sm text-slate-400">No orders found.</p>}</div>;
}

function OrdersView({ notify }: { notify: (n: Notice) => void }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]); const [search, setSearch] = useState(""); const [selected, setSelected] = useState<AdminOrder | null>(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { const result = await adminApi.orders(`page=1&limit=100&search=${encodeURIComponent(search)}`); setOrders(result.orders); } catch (e) { notify({ type: "error", text: (e as Error).message }); } finally { setLoading(false); } }, [notify, search]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  const update = async (status: string) => { if (!selected) return; try { const updated = await adminApi.orderStatus(selected.id, status); setSelected(updated); notify({ type: "success", text: "Order status updated." }); load(); } catch (e) { notify({ type: "error", text: (e as Error).message }); } };
  const payment = async (action: "approve" | "reject") => { if (!selected) return; const reason = action === "reject" ? prompt("Reason for rejecting this payment:") || "" : ""; if (action === "reject" && !reason) return; try { const updated = await adminApi.paymentReview(selected.id, action, reason); setSelected(updated); notify({ type: "success", text: `Payment ${action === "approve" ? "approved" : "rejected"}.` }); load(); } catch (e) { notify({ type: "error", text: (e as Error).message }); } };
  return <><PageHeader title="All orders" subtitle="Review every order, payment proof and fulfilment status." /><div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 outline-none" placeholder="Order ID, customer, email or phone" /></div>{loading ? <Loading /> : <OrderTable orders={orders} select={setSelected} />}</div>
    {selected && <Modal title={selected.orderId} close={() => setSelected(null)}><div className="space-y-5 text-sm"><div className="grid gap-3 rounded-2xl bg-amber-50 p-4 sm:grid-cols-2"><Info label="Customer" value={selected.customerName} /><Info label="Phone" value={selected.customerPhone} /><Info label="Email" value={selected.customerEmail || "—"} /><Info label="Total" value={`₹${selected.amount.toLocaleString("en-IN")}`} /><Info label="Payment" value={selected.paymentStatus} /><Info label="Order status" value={selected.status} /></div><Info label="Products" value={selected.product} /><Info label="Delivery address" value={selected.deliveryAddress || "—"} />{selected.paymentProofUrl && <a href={`${API_BASE_URL.replace(/\/api$/, "")}${selected.paymentProofUrl}`} target="_blank" rel="noreferrer" className={`${buttonClass} bg-white`}>View payment proof</a>}{selected.paymentStatus === "Awaiting Verification" && <div className="grid grid-cols-2 gap-3"><button onClick={() => payment("approve")} className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white">Approve payment</button><button onClick={() => payment("reject")} className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white">Reject payment</button></div>}<Field label="Update fulfilment status"><select value={selected.status} onChange={(e) => update(e.target.value)} className={inputClass}>{["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((s) => <option key={s}>{s}</option>)}</select></Field></div></Modal>}
  </>;
}

const emptyReview = { name: "", role: "Annai Customer", rating: 5, text: "", imageUrl: "", source: "Website", reviewDate: "", isVisible: true };
function ReviewsView({ notify }: { notify: (n: Notice) => void }) {
  const [reviews, setReviews] = useState<AdminReview[]>([]); const [editing, setEditing] = useState<AdminReview | null | undefined>(undefined);
  const load = useCallback(() => adminApi.reviews().then((r) => setReviews(r.testimonials)).catch((e) => notify({ type: "error", text: e.message })), [notify]);
  useEffect(() => { load(); }, [load]);
  const remove = async (item: AdminReview) => { if (!confirm(`Delete ${item.name}’s review?`)) return; try { await adminApi.deleteReview(item.id); notify({ type: "success", text: "Review deleted." }); load(); } catch (e) { notify({ type: "error", text: (e as Error).message }); } };
  return <><PageHeader title="Reviews" subtitle="Add, edit, publish and moderate customer feedback." action={<button onClick={() => setEditing(null)} className={buttonClass}><Plus className="h-4 w-4" /> Add review</button>} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reviews.map((item) => <article key={item.id} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-400">{item.role}</p></div><Status value={item.isVisible ? "Visible" : "Hidden"} /></div><div className="my-3 flex text-amber-500">{Array.from({ length: item.rating }, (_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div><p className="line-clamp-4 text-sm leading-6 text-slate-600">{item.text}</p><div className="mt-4 flex justify-end gap-2"><button onClick={() => adminApi.reviewVisible(item.id, !item.isVisible).then(load)} className="p-2 text-slate-500">{item.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><button onClick={() => setEditing(item)} className="p-2 text-amber-700"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(item)} className="p-2 text-red-600"><Trash2 className="h-4 w-4" /></button></div></article>)}</div>{editing !== undefined && <ReviewEditor review={editing} close={() => setEditing(undefined)} saved={() => { setEditing(undefined); load(); }} notify={notify} />}</>;
}

function ReviewEditor({ review, close, saved, notify }: { review: AdminReview | null; close: () => void; saved: () => void; notify: (n: Notice) => void }) {
  const [form, setForm] = useState(review || emptyReview); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); try { await adminApi.saveReview(form, review?.id); notify({ type: "success", text: "Review saved." }); saved(); } catch (reason) { notify({ type: "error", text: (reason as Error).message }); } finally { setBusy(false); } };
  return <Modal title={review ? "Edit review" : "Add review"} close={close}><form onSubmit={submit} className="space-y-4"><Field label="Customer name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></Field><div className="grid grid-cols-2 gap-4"><Field label="Customer label"><input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass} /></Field><Field label="Rating"><select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className={inputClass}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></Field></div><Field label="Review"><textarea required minLength={10} rows={5} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className={inputClass} /></Field><Field label="Review date"><input value={form.reviewDate || ""} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} className={inputClass} placeholder="July 2026" /></Field><Toggle label="Publish on storefront" checked={form.isVisible} onChange={(isVisible) => setForm({ ...form, isVisible })} /><button disabled={busy} className={`${buttonClass} w-full`}><Save className="h-4 w-4" /> Save review</button></form></Modal>;
}

function PopupView({ notify }: { notify: (n: Notice) => void }) {
  const [block, setBlock] = useState<ContentBlock>({ block_key: "home_popup", title: "Welcome offer", body: "{}", isActive: true });
  const [form, setForm] = useState({ imageUrl: "", linkUrl: "", alt: "Annai Jewellery promotion", delaySeconds: 2 });
  const [busy, setBusy] = useState(false);
  useEffect(() => { adminApi.contentBlocks().then(({ blocks }) => { const found = blocks.find((b) => b.block_key === "home_popup"); if (found) { setBlock(found); try { setForm((old) => ({ ...old, ...JSON.parse(found.body || "{}") })); } catch { /* keep safe defaults */ } } }).catch((e) => notify({ type: "error", text: e.message })); }, [notify]);
  const upload = async (file?: File) => { if (!file) return; setBusy(true); try { const data = await new Promise<string>((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.readAsDataURL(file); }); const result = await adminApi.uploadImage(data, "promotions"); setForm({ ...form, imageUrl: result.path || result.url || "" }); notify({ type: "success", text: "Popup image uploaded." }); } catch (e) { notify({ type: "error", text: (e as Error).message }); } finally { setBusy(false); } };
  const save = async (e: FormEvent) => { e.preventDefault(); setBusy(true); try { await adminApi.saveContentBlock("home_popup", { title: block.title, body: JSON.stringify(form), isActive: block.isActive }); notify({ type: "success", text: "Home popup updated." }); } catch (reason) { notify({ type: "error", text: (reason as Error).message }); } finally { setBusy(false); } };
  return <><PageHeader title="Popup advertisement" subtitle="Upload and control the promotional popup shown on the home page." /><form onSubmit={save} className="grid gap-6 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm lg:grid-cols-[1fr_.8fr]"><div className="space-y-4"><Field label="Campaign name"><input value={block.title} onChange={(e) => setBlock({ ...block, title: e.target.value })} className={inputClass} /></Field><Field label="Popup image URL"><input required value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className={inputClass} /></Field><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-5 text-sm font-semibold text-amber-700"><Upload className="h-5 w-5" /> Upload popup artwork<input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} /></label><Field label="Click destination (optional)"><input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className={inputClass} placeholder="/collection/new-arrivals" /></Field><Field label="Show after seconds"><input type="number" min={0} max={30} value={form.delaySeconds} onChange={(e) => setForm({ ...form, delaySeconds: Number(e.target.value) })} className={inputClass} /></Field><Toggle label="Popup enabled" checked={block.isActive} onChange={(isActive) => setBlock({ ...block, isActive })} /><button disabled={busy} className={`${buttonClass} w-full`}><Save className="h-4 w-4" /> Publish popup</button></div><div className="grid min-h-80 place-items-center rounded-2xl bg-slate-900/90 p-5">{form.imageUrl ? <img src={form.imageUrl} alt="Popup preview" className="max-h-[32rem] max-w-full rounded-2xl object-contain shadow-2xl" /> : <p className="text-sm text-white/60">Upload an image to preview it</p>}</div></form></>;
}

function SettingsView({ profile, notify }: { profile: AdminProfile; notify: (n: Notice) => void }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" }); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => { e.preventDefault(); if (form.newPassword !== form.confirm) return notify({ type: "error", text: "New passwords do not match." }); setBusy(true); try { const result = await adminApi.changePassword(form); notify({ type: "success", text: result.message }); setForm({ currentPassword: "", newPassword: "", confirm: "" }); } catch (reason) { notify({ type: "error", text: (reason as Error).message }); } finally { setBusy(false); } };
  return <><PageHeader title="Settings" subtitle="Manage the signed-in administrator and account security." /><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Admin account</h2><div className="mt-5 space-y-4"><Info label="Name" value={profile.name} /><Info label="Email" value={profile.email} /><Info label="Role" value={profile.role} /><Info label="API endpoint" value={API_BASE_URL} /></div></section><form onSubmit={submit} className="space-y-4 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Change password</h2><Field label="Current password"><input required type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className={inputClass} /></Field><Field label="New password"><input required minLength={12} type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className={inputClass} /></Field><Field label="Confirm new password"><input required minLength={12} type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={inputClass} /></Field><p className="text-xs text-slate-400">Use 12–72 characters with uppercase, lowercase, a number and a symbol.</p><button disabled={busy} className={`${buttonClass} w-full`}><LockKeyhole className="h-4 w-4" /> Update password</button></form></div></>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && close()}><section className="max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] bg-[#fffdfa] shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-amber-100 bg-white/95 px-5 py-4 backdrop-blur"><h2 className="font-semibold text-slate-900">{title}</h2><button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-amber-50 text-amber-800" aria-label="Close"><X className="h-4 w-4" /></button></header><div className="p-5">{children}</div></section></div>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-xs font-semibold text-slate-600"><span className="mb-1.5 block">{label}</span>{children}</label>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) { return <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-amber-600" />{label}</label>; }
function Info({ label, value }: { label: string; value: ReactNode }) { return <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><div className="mt-1 break-words text-sm text-slate-800">{value}</div></div>; }
function Status({ value }: { value: string }) { const positive = /paid|delivered|visible|active/i.test(value); const negative = /cancel|reject|failed|hidden/i.test(value); return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${positive ? "bg-emerald-50 text-emerald-700" : negative ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{value}</span>; }
function Loading() { return <div className="grid min-h-52 place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-amber-600" /></div>; }
function EmptyError({ message }: { message: string }) { return <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">{message}</div>; }

export default function AdminPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [view, setView] = useState<View>("dashboard");
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const notify = useCallback((next: Notice) => setNotice(next), []);
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
  if (checking) return <main className="grid min-h-screen place-items-center bg-amber-50"><LoaderCircle className="h-8 w-8 animate-spin text-amber-600" /></main>;
  if (!profile) return <><Message notice={notice} clear={() => setNotice(null)} /><AdminLogin onLogin={setProfile} /></>;
  const logout = async () => { try { await adminApi.logout(); } finally { setProfile(null); } };
  return <div className="min-h-screen bg-[#f8f6f1] text-slate-800"><Message notice={notice} clear={() => setNotice(null)} />
    {menu && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setMenu(false)} aria-label="Close menu" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-amber-200 bg-[#fffdfa] transition-transform lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-24 items-center border-b border-amber-100 px-6"><img src={logo} alt="Annai Jewellery" className="h-16 w-auto object-contain" /></div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">{nav.map(([id, label, Icon]) => <button key={id} onClick={() => { setView(id); setMenu(false); }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${view === id ? "bg-gradient-to-r from-[#b8860b] to-[#dfb72d] text-white shadow-md" : "text-slate-600 hover:bg-amber-50 hover:text-amber-800"}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
      <div className="border-t border-amber-100 p-4"><div className="mb-3 flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-800"><ShieldCheck className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-xs font-semibold">{profile.name}</p><p className="truncate text-[10px] text-slate-400">{profile.email}</p></div></div><button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" /> Sign out</button></div>
    </aside>
    <div className="lg:pl-72"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-amber-100 bg-white/90 px-4 backdrop-blur sm:px-6"><button onClick={() => setMenu(true)} className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 lg:hidden"><Menu className="h-5 w-5" /></button><div className="hidden text-xs text-slate-400 sm:block">Annai Jewellery administration</div><a href="./#/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700"><Eye className="h-4 w-4" /> View store</a></header>
      <main className="p-4 sm:p-6 xl:p-8">{view === "dashboard" && <Dashboard setView={setView} />}{view === "products" && <ProductsView notify={notify} />}{view === "categories" && <CategoriesView notify={notify} />}{view === "orders" && <OrdersView notify={notify} />}{view === "reviews" && <ReviewsView notify={notify} />}{view === "popup" && <PopupView notify={notify} />}{view === "settings" && <SettingsView profile={profile} notify={notify} />}</main>
    </div>
  </div>;
}
