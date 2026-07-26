import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Calendar, Edit3, Heart, Loader2, LogOut, MapPin, Package, Plus, ReceiptText, Save, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { websiteApi, type WebsiteOrder, type WebsiteProduct, type WebsiteUser } from "../lib/api";
import { clean, isName, isPhone, limitPhoneDigits, maxLength, phoneDigits } from "../lib/validation";
import { Card, SEO } from "../components/JewelleryUI";
import { productShelves } from "./HomePage";

const money = (value: number) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
const userTokenKey = "annai_user_token";
const userProfileKey = "annai_user_profile";

const authHeaders = () => Boolean(localStorage.getItem(userTokenKey));
const isDemoAccount = () => localStorage.getItem(userTokenKey) === "demo-annai-token";

const demoOrders: WebsiteOrder[] = [
  { id: 1, orderId: "AN24071801", product: "Peacock Heritage Necklace", category: "Necklaces", amount: 98000, status: "Delivered", paymentStatus: "Paid", paymentMethod: "UPI", deliveryMode: "Insured Delivery", deliveryAddress: "Anna Nagar, Chennai", invoiceNumber: "INV-24071801", notes: "Gift wrapped", createdAt: "2026-07-18" },
  { id: 2, orderId: "AN24070642", product: "Floral Gold-Plated Studs", category: "Earrings", amount: 1299, status: "Shipped", paymentStatus: "Paid", paymentMethod: "Card", deliveryMode: "Insured Delivery", deliveryAddress: "Anna Nagar, Chennai", invoiceNumber: "INV-24070642", createdAt: "2026-07-06" },
  { id: 3, orderId: "AN24061519", product: "Silver Infinity Bracelet", category: "Bracelets", amount: 5800, status: "Processing", paymentStatus: "Paid", paymentMethod: "UPI", deliveryMode: "Standard Delivery", deliveryAddress: "Anna Nagar, Chennai", invoiceNumber: "INV-24061519", createdAt: "2026-06-15" },
];

const demoWishlist: WebsiteProduct[] = productShelves.flatMap((shelf) => shelf.products).slice(5, 8).map((product, index) => ({
  id: `demo-wish-${index}`,
  name: product.name,
  category: product.material,
  goal: "Jewellery",
  flavor: "",
  badge: product.badge || "Favourite",
  price: Number(product.price.replace(/[^\d]/g, "")),
  stock: 8,
  inStock: true,
  rating: 5,
  image: product.image,
}));

const logout = () => {
  localStorage.removeItem(userTokenKey);
  localStorage.removeItem(userProfileKey);
  window.location.href = "/login";
};

const MemberShell = ({ title, text, children }: { title: string; text: string; children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  let member: Partial<WebsiteUser> = {};
  try {
    member = JSON.parse(localStorage.getItem(userProfileKey) || "{}");
  } catch {
    member = {};
  }
  useEffect(() => {
    if (!authHeaders()) navigate("/login");
  }, [navigate]);

  return (
    <>
      <SEO title={title} description={text} />
      <section className="bg-[#fbf8f1] px-4 pb-14 pt-28 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-[0_16px_45px_rgba(130,91,24,0.09)] lg:sticky lg:top-28">
              <div className="bg-gradient-to-br from-amber-100 via-amber-50 to-white p-5 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-amber-600 text-xl font-bold text-white shadow-md">{(member.name || "A").charAt(0).toUpperCase()}</div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Annai Customer</p>
                <h2 className="mt-1 font-semibold text-slate-900">{member.name || "My Account"}</h2>
                <p className="mt-1 truncate text-xs text-slate-500">{member.email || "Customer account"}</p>
              </div>
              <div className="p-4">
              <nav className="mt-6 grid grid-cols-3 gap-2 text-sm font-semibold lg:grid-cols-1">
                {[
                  ["Profile", "/profile", UserRound],
                  ["Orders", "/my-orders", Package],
                  ["Wishlist", "/wishlist", Heart],
                ].map(([label, href, Icon]) => {
                  const active = location.pathname === href || (href === "/my-orders" && location.pathname.startsWith("/my-orders/"));
                  return <Link key={href as string} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 transition lg:justify-start ${active ? "border-amber-500 bg-amber-50 text-amber-700" : "border-amber-100 text-slate-600 hover:border-amber-300 hover:text-amber-600"}`} to={href as string}><Icon className="h-4 w-4"/><span>{label as string}</span></Link>;
                })}
              </nav>
              <button onClick={logout} className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-600 hover:text-white">
                <LogOut className="h-4 w-4" /> Logout
              </button>
              </div>
            </aside>
            <div className="min-w-0">
              <header className="mb-6 rounded-3xl border border-amber-100 bg-white px-6 py-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">Annai Customer Account</p>
                <h1 className="mt-1 text-3xl font-semibold text-slate-900">{title}</h1>
                <p className="mt-2 text-sm text-slate-500">{text}</p>
              </header>
              {children}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export const UserProfilePage = () => {
  const [user, setUser] = useState<WebsiteUser | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", plan: "", goal: "", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [addressEditor, setAddressEditor] = useState<number | "new" | null>(null);
  const [addressDraft, setAddressDraft] = useState("");

  useEffect(() => {
    websiteApi.profile()
      .then((data) => {
        setUser(data);
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          plan: data.plan || "Website Member",
          goal: data.goal || "",
          address: data.address || "",
        });
        localStorage.setItem(userProfileKey, JSON.stringify(data));
        const savedAddresses = JSON.parse(localStorage.getItem(`annai_addresses_${data.id}`) || "[]") as string[];
        setAddresses(savedAddresses.length ? savedAddresses : data.address ? [data.address] : []);
      })
      .catch((error) => {
        try {
          const stored = JSON.parse(localStorage.getItem(userProfileKey) || "null") as WebsiteUser | null;
          if (stored) {
            setUser(stored);
            setForm({ name: stored.name || "", phone: stored.phone || "", plan: stored.plan || "Annai Customer", goal: stored.goal || "", address: stored.address || "" });
            const savedAddresses = JSON.parse(localStorage.getItem(`annai_addresses_${stored.id}`) || "[]") as string[];
            setAddresses(savedAddresses.length ? savedAddresses : stored.address ? [stored.address] : []);
            return;
          }
        } catch {
          // Show the API error below when no local profile is available.
        }
        setMessage(error instanceof Error ? error.message : "Unable to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const next: Record<string, string> = {};
    if (!isName(form.name)) next.name = "Enter a valid name.";
    if (form.phone && !isPhone(form.phone)) next.phone = "Enter a valid 10 digit phone.";
    if (!maxLength(form.plan, 80)) next.plan = "Plan must be 80 characters or less.";
    if (!maxLength(form.goal, 120)) next.goal = "Goal must be 120 characters or less.";
    if (!maxLength(form.address, 300)) next.address = "Address must be 300 characters or less.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      if (localStorage.getItem(userTokenKey) === "demo-annai-token") {
        const data = { ...user!, name: clean(form.name), phone: phoneDigits(form.phone), plan: clean(form.plan), goal: clean(form.goal), address: clean(form.address) };
        setUser(data);
        localStorage.setItem(userProfileKey, JSON.stringify(data));
        window.dispatchEvent(new Event("annai-user-session"));
        setMessage("Profile updated successfully.");
        setEditing(false);
        return;
      }
      const data = await websiteApi.updateProfile({
        name: clean(form.name),
        phone: phoneDigits(form.phone),
        plan: clean(form.plan),
        goal: clean(form.goal),
        address: clean(form.address),
      });
      setUser(data);
      localStorage.setItem(userProfileKey, JSON.stringify(data));
      setMessage("Profile updated successfully.");
      setEditing(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = () => {
    const value = clean(addressDraft);
    if (!value || value.length > 300 || !user) return;
    const next = addressEditor === "new" ? [...addresses, value].slice(0, 5) : addresses.map((item, index) => index === addressEditor ? value : item);
    setAddresses(next);
    localStorage.setItem(`annai_addresses_${user.id}`, JSON.stringify(next));
    setForm((current) => ({ ...current, address: next[0] || "" }));
    setAddressEditor(null);
    setAddressDraft("");
  };

  const deleteAddress = (index: number) => {
    if (!user) return;
    const next = addresses.filter((_, addressIndex) => addressIndex !== index);
    setAddresses(next);
    localStorage.setItem(`annai_addresses_${user.id}`, JSON.stringify(next));
    setForm((current) => ({ ...current, address: next[0] || "" }));
  };

  return (
    <MemberShell title="My Profile" text="Manage your Annai account, jewellery preferences and delivery information.">
      {loading ? <Loading /> : (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">
            <div className="flex flex-col gap-5 bg-gradient-to-r from-amber-50 to-white p-6 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Personal overview</p><h2 className="mt-1 text-xl font-semibold">Your account details</h2><p className="mt-1 text-sm text-slate-500">Keep your contact information and preferences up to date.</p></div>
              {!editing&&<button onClick={()=>setEditing(true)} className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-600 hover:text-white"><Edit3 className="h-4 w-4"/>Edit profile</button>}
            </div>
            {!editing ? (
              <div className="grid gap-px bg-amber-100 sm:grid-cols-3">
                {[["Phone", user?.phone || "-"], ["Membership", user?.plan || "Annai Customer"], ["Jewellery preference", user?.goal || "-"]].map(([label,value])=><div key={label} className="bg-white p-5"><p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 font-semibold">{value}</p></div>)}
              </div>
            ) : (
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                <Field label="Full name" value={form.name} error={errors.name} onChange={(value)=>setForm({...form,name:value})}/>
                <Field label="Phone number" value={form.phone} error={errors.phone} onChange={(value)=>setForm({...form,phone:limitPhoneDigits(value)})}/>
                <Field label="Membership" value={form.plan} error={errors.plan} onChange={(value)=>setForm({...form,plan:value})}/>
                <Field label="Jewellery preference" value={form.goal} error={errors.goal} onChange={(value)=>setForm({...form,goal:value})}/>
                <div className="flex gap-3 sm:col-span-2"><button disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}Save changes</button><button onClick={()=>setEditing(false)} className="rounded-full border border-amber-200 px-5 py-2.5 text-xs font-semibold">Cancel</button></div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Delivery book</p><h2 className="mt-1 text-xl font-semibold">Saved addresses <span className="text-sm font-normal text-slate-500">({addresses.length}/5)</span></h2></div>{addresses.length<5&&<button onClick={()=>{setAddressEditor("new");setAddressDraft("");}} className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4"/>Add address</button>}</div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {addresses.map((address,index)=><article key={`${address}-${index}`} className="relative rounded-2xl border border-amber-100 bg-[#fbf8f1] p-5"><div className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"/><div><p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{index===0?"Default address":`Address ${index+1}`}</p><p className="mt-2 text-sm leading-6 text-slate-600">{address}</p></div></div><div className="mt-4 flex gap-2 border-t border-amber-100 pt-3"><button onClick={()=>{setAddressEditor(index);setAddressDraft(address);}} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 px-3 py-1.5 text-[11px] font-semibold"><Edit3 className="h-3.5 w-3.5"/>Edit</button><button onClick={()=>deleteAddress(index)} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 px-3 py-1.5 text-[11px] font-semibold text-amber-700"><Trash2 className="h-3.5 w-3.5"/>Delete</button></div></article>)}
              {!addresses.length&&<div className="rounded-2xl border border-dashed border-amber-200 p-8 text-center text-sm text-slate-500 md:col-span-2">No saved address yet. Add an address for faster checkout.</div>}
            </div>
            {addressEditor!==null&&<div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-5"><div className="flex items-center justify-between"><h3 className="font-semibold">{addressEditor==="new"?"Add new address":"Edit address"}</h3><button onClick={()=>setAddressEditor(null)} aria-label="Close address form"><X className="h-4 w-4"/></button></div><textarea autoFocus value={addressDraft} maxLength={300} onChange={(event)=>setAddressDraft(event.target.value)} placeholder="House number, street, area, city, state and PIN code" className="mt-4 min-h-24 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500"/><div className="mt-3 flex gap-3"><button onClick={saveAddress} className="rounded-full bg-amber-600 px-5 py-2 text-xs font-semibold text-white">Save address</button><button onClick={()=>setAddressEditor(null)} className="rounded-full border border-amber-200 px-5 py-2 text-xs font-semibold">Cancel</button></div></div>}
            {message&&<p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">{message}</p>}
          </section>
        </div>
      )}
    </MemberShell>
  );
};

export const UserOrdersPage = () => {
  const [orders, setOrders] = useState<WebsiteOrder[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    websiteApi.myOrders()
      .then((data) => setOrders(isDemoAccount() && !data.orders?.length ? demoOrders : data.orders || []))
      .catch((error) => isDemoAccount() ? setOrders(demoOrders) : setMessage(error instanceof Error ? error.message : "Unable to load orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MemberShell title="My Orders" text="Track your jewellery purchases, payment status, invoice and delivery details.">
      {loading ? <Loading /> : (
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <Package className="h-6 w-6 text-amber-600" />
            <h2 className="text-xl font-semibold">Order history</h2>
          </div>
          {message && <p className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">{message}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  {["Order", "Product", "Amount", "Payment", "Status", "Date", ""].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}
                </tr>
              </thead>
              <tbody>
                {orders.length ? orders.map((order) => (
                  <tr key={String(order.id)} className="border-b">
                    <td className="px-3 py-4 font-semibold">{order.orderId}</td>
                    <td className="px-3 py-4">{order.product}</td>
                    <td className="px-3 py-4">{money(order.amount)}</td>
                    <td className="px-3 py-4">{order.paymentStatus}</td>
                    <td className="px-3 py-4"><Status status={order.status} /></td>
                    <td className="px-3 py-4">{String(order.createdAt || "").slice(0, 10)}</td>
                    <td className="px-3 py-4"><Link to={`/my-orders/${order.orderId}`} className="font-semibold text-amber-600">View</Link></td>
                  </tr>
                )) : <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </MemberShell>
  );
};

export const UserOrderDetailsPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<WebsiteOrder | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    if (isDemoAccount()) {
      setOrder(demoOrders.find((item) => item.orderId === id) || null);
      setLoading(false);
      return;
    }
    websiteApi.orderDetails(id)
      .then(setOrder)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load order."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <MemberShell title="Order Details" text="View invoice, payment and fulfilment information for your order.">
      {loading ? <Loading /> : order ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <ReceiptText className="h-7 w-7 text-amber-600" />
              <div>
                <p className="text-sm text-slate-500">Invoice {order.invoiceNumber || "-"}</p>
                <h2 className="text-2xl font-semibold">{order.orderId}</h2>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Product" value={order.product} />
              <Info label="Category" value={order.category || "-"} />
              <Info label="Amount" value={money(order.amount)} />
              <Info label="Payment" value={`${order.paymentStatus} / ${order.paymentMethod || "-"}`} />
              <Info label="Delivery" value={order.deliveryMode || "-"} />
              <Info label="Date" value={String(order.createdAt || "").slice(0, 10)} />
            </div>
          </Card>
          <Card>
            <Calendar className="mb-4 h-7 w-7 text-amber-600" />
            <h3 className="text-xl font-semibold">Fulfilment</h3>
            <div className="mt-4 space-y-3">
              <Info label="Status" value={order.status} />
              <Info label="Address" value={order.deliveryAddress || "Pickup at store"} />
              <Info label="Notes" value={order.notes || "-"} />
            </div>
          </Card>
        </div>
      ) : <Card><p className="text-sm text-amber-600">{message || "Order not found."}</p></Card>}
    </MemberShell>
  );
};

export const UserWishlistPage = () => {
  const [products, setProducts] = useState<WebsiteProduct[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    websiteApi.wishlist()
      .then((data) => setProducts(isDemoAccount() && !data.products?.length ? demoWishlist : data.products || []))
      .catch((error) => isDemoAccount() ? setProducts(demoWishlist) : setMessage(error instanceof Error ? error.message : "Unable to load wishlist."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (productId: string | number) => {
    if (isDemoAccount()) {
      setProducts((current) => current.filter((item) => String(item.id) !== String(productId)));
      return;
    }
    await websiteApi.removeWishlist(productId);
    setProducts((current) => current.filter((item) => String(item.id) !== String(productId)));
  };

  return (
    <MemberShell title="My Wishlist" text="Jewellery designs you have saved for later.">
      {loading ? <Loading /> : (
        <>
          {message && <p className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">{message}</p>}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.length ? products.map((product) => (
              <Card key={String(product.id)}>
                <img src={product.image} alt={product.name} className="mb-4 h-48 w-full rounded-2xl object-contain" />
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{product.category}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xl font-semibold text-amber-600">{money(product.price)}</span>
                  <button onClick={() => remove(product.id)} className="inline-flex items-center gap-2 rounded-full border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-600 hover:text-white">
                    <Heart className="h-4 w-4 fill-current" /> Remove
                  </button>
                </div>
              </Card>
            )) : <Card className="sm:col-span-2 lg:col-span-3"><p className="text-center text-sm text-slate-500">No wishlist products yet.</p></Card>}
          </div>
        </>
      )}
    </MemberShell>
  );
};

const Field = ({ label, value, error, onChange }: { label: string; value: string; error?: string; onChange: (value: string) => void }) => (
  <label>
    <span className="mb-1 block text-sm font-semibold text-slate-600">{label}</span>
    <input value={value} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-amber-500 ${error ? "border-amber-500" : "border-slate-200"}`} />
    {error && <p className="mt-1 text-xs text-amber-600">{error}</p>}
  </label>
);

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <p className="mt-1 font-semibold">{value}</p>
  </div>
);

const Status = ({ status }: { status: string }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status === "Delivered" ? "bg-green-100 text-green-700" : status === "Cancelled" ? "bg-amber-100 text-amber-700" : "bg-amber-100 text-amber-700"}`}>
    {status}
  </span>
);

const Loading = () => (
  <Card>
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-amber-600" /> Loading account data...
    </div>
  </Card>
);

export default UserProfilePage;
