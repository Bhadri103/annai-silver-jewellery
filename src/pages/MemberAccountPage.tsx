import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Calendar, ChevronRight, Edit3, Eye, EyeOff, Heart, Loader2, LockKeyhole, LogOut, MapPin, Menu, Package, Plus, ReceiptText, Save, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { websiteApi, type WebsiteAddress, type WebsiteOrder, type WebsiteProduct, type WebsiteUser } from "../lib/api";
import { clean, isName, isPhone, limitPhoneDigits, maxLength, phoneDigits } from "../lib/validation";
import { Card, SEO } from "../components/JewelleryUI";
import { notifyWishlistUpdated } from "../lib/wishlist";

const money = (value: number) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
const userProfileKey = "annai_user_profile";

const MemberShell = ({ title, text, children }: { title: string; text: string; children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [member, setMember] = useState<Partial<WebsiteUser>>(() => {
    try {
      return JSON.parse(localStorage.getItem(userProfileKey) || "{}");
    } catch {
      return {};
    }
  });
  const logout = async () => {
    try {
      await websiteApi.logout();
    } catch {
      // Clear local state even if the session has already expired.
    } finally {
      localStorage.removeItem(userProfileKey);
      window.dispatchEvent(new Event("annai-user-session"));
      navigate("/login", { replace: true });
    }
  };
  useEffect(() => {
    let active = true;
    websiteApi.profile()
      .then((profile) => {
        if (!active) return;
        setMember(profile);
        localStorage.setItem(userProfileKey, JSON.stringify(profile));
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem(userProfileKey);
        window.dispatchEvent(new Event("annai-user-session"));
        navigate("/login", { replace: true });
      });
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [drawerOpen]);

  const navigation = [
    ["Profile", "/profile", UserRound],
    ["Orders", "/my-orders", Package],
    ["Wishlist", "/wishlist", Heart],
    ["Password", "/change-password", LockKeyhole],
  ] as const;

  const accountPanel = (mobile = false) => <>
    <div className={`flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white p-4 ${mobile ? "" : "lg:block lg:text-center"}`}>
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-[#c99516] to-[#e2bd38] text-lg font-bold text-white shadow-md ${mobile ? "" : "lg:mx-auto"}`}>{(member.name || "A").charAt(0).toUpperCase()}</div>
      <div className={`min-w-0 ${mobile ? "" : "lg:mt-2"}`}>
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-600">Annai Customer</p>
        <h2 className="mt-0.5 truncate text-sm font-semibold text-slate-900">{member.name || "My Account"}</h2>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{member.email || "Customer account"}</p>
      </div>
    </div>
    <div className="p-3">
      <nav className="space-y-1 text-sm font-semibold">
        {navigation.map(([label, href, Icon]) => {
          const active = location.pathname === href || (href === "/my-orders" && location.pathname.startsWith("/my-orders/"));
          return <Link key={href} onClick={() => setDrawerOpen(false)} className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 transition ${active ? "bg-amber-50 text-amber-800" : "text-slate-600 hover:bg-[#fbf8f1] hover:text-amber-700"}`} to={href}><Icon className="h-4 w-4 shrink-0"/><span className="truncate">{label}</span><ChevronRight className="ml-auto h-3.5 w-3.5"/></Link>;
        })}
      </nav>
      <button onClick={logout} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </div>
  </>;

  return (
    <>
      <SEO title={title} description={text} />
      <section className="min-h-[70vh] bg-[#f8f6f1] px-3 pb-10 pt-4 sm:px-5 sm:pt-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-start gap-4 lg:grid-cols-[255px_minmax(0,1fr)]">
            <aside className="hidden overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-[0_8px_28px_rgba(92,65,19,0.07)] lg:sticky lg:top-36 lg:block">{accountPanel()}</aside>
            <div className="min-w-0">
              <header className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-100 bg-white px-4 py-4 shadow-sm sm:px-5">
                <button type="button" onClick={() => setDrawerOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-200 bg-amber-50 text-amber-800 transition hover:bg-amber-100 lg:hidden" aria-label="Open account menu" aria-expanded={drawerOpen}><Menu className="h-5 w-5"/></button>
                <div className="min-w-0"><h2 className="storefront-page-title !mt-0">{title}</h2><p className="storefront-page-copy !mt-1">{text}</p></div>
              </header>
              {children}
            </div>
          </div>
        </div>
      </section>
      <div ref={(node) => { if (node) node.inert = !drawerOpen; }} className={`fixed inset-0 z-[170] lg:hidden ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
        <button type="button" onClick={() => setDrawerOpen(false)} className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`} aria-label="Close account menu"/>
        <aside role="dialog" aria-modal="true" aria-label="Account menu" className={`absolute inset-y-0 left-0 flex w-[min(84vw,320px)] flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between border-b border-amber-100 px-4 py-3"><strong className="text-sm text-slate-900">My Account</strong><button type="button" onClick={() => setDrawerOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-amber-50 text-amber-800" aria-label="Close account menu"><X className="h-4 w-4"/></button></div>
          {accountPanel(true)}
        </aside>
      </div>
    </>
  );
};

export const UserProfilePage = () => {
  const [user, setUser] = useState<WebsiteUser | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addresses, setAddresses] = useState<WebsiteAddress[]>([]);
  const [addressEditor, setAddressEditor] = useState<number | "new" | null>(null);
  const [addressDraft, setAddressDraft] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);

  useEffect(() => {
    websiteApi.profile()
      .then(async (data) => {
        setUser(data);
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
        });
        localStorage.setItem(userProfileKey, JSON.stringify(data));
        let next: WebsiteAddress[] = [];
        try {
          const remote = await websiteApi.addresses();
          next = remote.addresses || [];
          const localAddresses = JSON.parse(localStorage.getItem(`annai_addresses_${data.id}`) || "[]") as string[];
          for (const localAddress of localAddresses) {
            const value = clean(localAddress);
            if (value.length >= 8 && !next.some((item) => clean(item.address).toLowerCase() === value.toLowerCase())) {
              try {
                const created = await websiteApi.createAddress({ address: value, isDefault: next.length === 0 });
                next = [...next, created];
              } catch {
                // Continue loading the server address book if one legacy address cannot be migrated.
              }
            }
          }
          localStorage.removeItem(`annai_addresses_${data.id}`);
        } catch {
          if (data.address) next = [{ id: 0, label: "Default address", address: data.address, isDefault: true }];
        }
        setAddresses(next.sort((left, right) => Number(right.isDefault) - Number(left.isDefault)));
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Unable to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const next: Record<string, string> = {};
    if (!isName(form.name)) next.name = "Enter a valid name.";
    if (form.phone && !isPhone(form.phone)) next.phone = "Enter a valid 10 digit phone.";
    if (!maxLength(form.address, 300)) next.address = "Address must be 300 characters or less.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const data = await websiteApi.updateProfile({
        name: clean(form.name),
        phone: phoneDigits(form.phone),
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

  const saveAddress = async () => {
    const value = clean(addressDraft);
    if (!user) return;
    if (value.length < 8) {
      setMessage("Enter a complete delivery address.");
      return;
    }
    if (value.length > 300) {
      setMessage("Address must be 300 characters or less.");
      return;
    }
    setAddressSaving(true);
    setMessage("");
    try {
      if (addressEditor === "new") {
        const created = await websiteApi.createAddress({ address: value, isDefault: addresses.length === 0 });
        setAddresses((current) => [...current.filter((item) => item.id !== created.id), created].sort((left, right) => Number(right.isDefault) - Number(left.isDefault)));
        if (created.isDefault) {
          setForm((current) => ({ ...current, address: created.address }));
          const nextUser = { ...user, address: created.address };
          setUser(nextUser);
          localStorage.setItem(userProfileKey, JSON.stringify(nextUser));
        }
      } else {
        const currentAddress = addresses.find((item) => item.id === addressEditor);
        if (!currentAddress) return;
        const updated = await websiteApi.updateAddress(currentAddress.id, {
          address: value,
          label: currentAddress.label,
          isDefault: currentAddress.isDefault,
        });
        setAddresses((current) => current.map((item) => item.id === updated.id ? updated : item));
        if (updated.isDefault) {
          setForm((current) => ({ ...current, address: updated.address }));
          const nextUser = { ...user, address: updated.address };
          setUser(nextUser);
          localStorage.setItem(userProfileKey, JSON.stringify(nextUser));
        }
      }
      setMessage("Saved address updated.");
      setAddressEditor(null);
      setAddressDraft("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save address.");
    } finally {
      setAddressSaving(false);
    }
  };

  const deleteAddress = async (addressId: number) => {
    if (!user) return;
    try {
      await websiteApi.deleteAddress(addressId);
      const nextResponse = await websiteApi.addresses();
      const next = nextResponse.addresses || [];
      setAddresses(next);
      const defaultAddress = next.find((item) => item.isDefault)?.address || "";
      setForm((current) => ({ ...current, address: defaultAddress }));
      const nextUser = { ...user, address: defaultAddress };
      setUser(nextUser);
      localStorage.setItem(userProfileKey, JSON.stringify(nextUser));
      setMessage("Saved address removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove address.");
    }
  };

  return (
    <MemberShell title="My Profile" text="Manage your Annai account and delivery information.">
      {loading ? <Loading /> : (
        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 bg-gradient-to-r from-amber-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-600">Personal overview</p><h2 className="mt-1 text-base font-semibold">Your account details</h2><p className="mt-1 text-xs text-slate-500">Keep your contact information up to date.</p></div>
              {!editing&&<button onClick={()=>setEditing(true)} className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-600 hover:text-white"><Edit3 className="h-4 w-4"/>Edit profile</button>}
            </div>
            {!editing ? (
              <div className="bg-white p-4">
                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Phone</p>
                <p className="mt-1.5 text-sm font-semibold">{user?.phone || "-"}</p>
              </div>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label="Full name" value={form.name} error={errors.name} onChange={(value)=>setForm({...form,name:value})}/>
                <Field label="Phone number" value={form.phone} error={errors.phone} onChange={(value)=>setForm({...form,phone:limitPhoneDigits(value)})}/>
                <div className="flex gap-3 sm:col-span-2"><button disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}Save changes</button><button onClick={()=>setEditing(false)} className="rounded-full border border-amber-200 px-5 py-2.5 text-xs font-semibold">Cancel</button></div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-600">Delivery book</p><h2 className="mt-1 text-base font-semibold">Saved addresses <span className="text-xs font-normal text-slate-500">({addresses.length}/5)</span></h2></div>{addresses.length<5&&<button onClick={()=>{setAddressEditor("new");setAddressDraft("");}} className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-2 text-[11px] font-semibold text-white"><Plus className="h-3.5 w-3.5"/>Add address</button>}</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {addresses.map((savedAddress,index)=><article key={savedAddress.id} className="relative rounded-xl border border-amber-100 bg-[#fbf8f1] p-4"><div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"/><div><p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">{savedAddress.isDefault?"Default address":savedAddress.label || `Address ${index+1}`}</p><p className="mt-1.5 text-xs leading-5 text-slate-600">{savedAddress.address}</p></div></div><div className="mt-3 flex gap-2 border-t border-amber-100 pt-2.5"><button onClick={()=>{setAddressEditor(savedAddress.id);setAddressDraft(savedAddress.address);}} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 px-3 py-1.5 text-[10px] font-semibold"><Edit3 className="h-3 w-3"/>Edit</button><button onClick={()=>deleteAddress(savedAddress.id)} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 px-3 py-1.5 text-[10px] font-semibold text-amber-700"><Trash2 className="h-3 w-3"/>Delete</button></div></article>)}
              {!addresses.length&&<div className="rounded-2xl border border-dashed border-amber-200 p-8 text-center text-sm text-slate-500 md:col-span-2">No saved address yet. Add an address for faster checkout.</div>}
            </div>
            {addressEditor!==null&&<div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-5"><div className="flex items-center justify-between"><h3 className="font-semibold">{addressEditor==="new"?"Add new address":"Edit address"}</h3><button onClick={()=>setAddressEditor(null)} aria-label="Close address form"><X className="h-4 w-4"/></button></div><textarea autoFocus value={addressDraft} maxLength={300} onChange={(event)=>setAddressDraft(event.target.value)} placeholder="House number, street, area, city, state and PIN code" className="mt-4 min-h-24 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500"/><div className="mt-3 flex gap-3"><button disabled={addressSaving} onClick={saveAddress} className="rounded-full bg-amber-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60">{addressSaving?"Saving...":"Save address"}</button><button disabled={addressSaving} onClick={()=>setAddressEditor(null)} className="rounded-full border border-amber-200 px-5 py-2 text-xs font-semibold">Cancel</button></div></div>}
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
      .then((data) => setOrders(data.orders || []))
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load orders."))
      .finally(() => setLoading(false));
  }, []);

  const groupedOrders = orders.reduce<Record<string, WebsiteOrder[]>>((groups, order) => {
    const date = String(order.createdAt || "").slice(0, 10) || "Date unavailable";
    (groups[date] ||= []).push(order);
    return groups;
  }, {});

  return (
    <MemberShell title="My Orders" text="Track your jewellery purchases, payment status and delivery details.">
      {loading ? <Loading /> : (
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <Package className="h-6 w-6 text-amber-600" />
            <h2 className="text-md font-semibold">Order history</h2>
          </div>
          {message && <p className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">{message}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  {["Order", "Product", "Amount", "Payment", "Status", ""].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}
                </tr>
              </thead>
              {orders.length ? Object.entries(groupedOrders).map(([date, dateOrders]) => (
                <tbody key={date}>
                  <tr className="border-y border-amber-100 bg-amber-50/70">
                    <th colSpan={6} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                      Purchased on {date}
                    </th>
                  </tr>
                  {dateOrders.map((order) => (
                    <tr key={String(order.id)} className="border-b">
                      <td className="px-3 py-4 font-semibold">{order.orderId}</td>
                      <td className="px-3 py-4">{order.product}</td>
                      <td className="px-3 py-4">{money(order.amount)}</td>
                      <td className="px-3 py-4">{order.paymentStatus}</td>
                      <td className="px-3 py-4"><Status status={order.status} /></td>
                      <td className="px-3 py-4"><Link to={`/my-orders/${order.orderId}`} className="font-semibold text-amber-600">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              )) : <tbody><tr><td colSpan={6} className="px-3 py-10 text-center text-slate-500">No orders yet.</td></tr></tbody>}
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
    websiteApi.orderDetails(id)
      .then(setOrder)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load order."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <MemberShell title="Order Details" text="View payment and fulfilment information for your order.">
      {loading ? <Loading /> : order ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <div className="mb-4 flex items-center gap-2.5">
              <ReceiptText className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Invoice {order.invoiceNumber || "-"}</p>
                <h2 className="text-base font-semibold">{order.orderId}</h2>
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
            {order.items?.length ? <div className="mt-4 border-t border-amber-100 pt-4"><h3 className="mb-3 text-sm font-semibold">Items</h3><div className="space-y-2">{order.items.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-amber-50/60 p-2.5"><OrderItemImage src={item.productSnapshot?.image} name={item.productName}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.productName}</p><p className="text-[11px] text-slate-500">Quantity {item.quantity}</p></div><span className="text-xs font-semibold">{money(item.lineTotal)}</span></div>)}</div></div> : null}
          </Card>
          <Card>
            <Calendar className="mb-4 h-7 w-7 text-amber-600" />
            <h3 className="text-md font-semibold">Fulfilment</h3>
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
  const navigate = useNavigate();
  const [products, setProducts] = useState<WebsiteProduct[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    websiteApi.wishlist()
      .then((data) => setProducts(data.products || []))
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load wishlist."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (productId: string | number) => {
    await websiteApi.removeWishlist(productId);
    setProducts((current) => current.filter((item) => String(item.id) !== String(productId)));
    notifyWishlistUpdated();
  };

  return (
    <MemberShell title="My Wishlist" text="Jewellery designs you have saved for later.">
      {loading ? <Loading /> : (
        <>
          {message && <p className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">{message}</p>}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.length ? products.map((product) => (
              <div
                key={String(product.id)}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/product/${product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`)}
                onKeyDown={(event) => { if (event.key === "Enter" && event.target === event.currentTarget) navigate(`/product/${product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`); }}
                className="group cursor-pointer rounded-3xl outline-none transition hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <Card className="h-full transition group-hover:shadow-xl">
                <img src={product.image} alt={product.name} className="mb-4 h-48 w-full rounded-2xl object-contain" />
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{product.category}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-md font-semibold text-amber-600">{money(product.price)}</span>
                  <button onClick={(event) => { event.stopPropagation(); void remove(product.id); }} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white">
                    <Heart className="h-4 w-4 fill-current" /> Remove
                  </button>
                </div>
                </Card>
              </div>
            )) : <Card className="sm:col-span-2 lg:col-span-3"><p className="text-center text-sm text-slate-500">No wishlist products yet.</p></Card>}
          </div>
        </>
      )}
    </MemberShell>
  );
};

export const UserChangePasswordPage = () => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const next: Record<string, string> = {};
    if (!form.currentPassword) next.currentPassword = "Enter your current password.";
    if (form.newPassword.length < 6) next.newPassword = "Use at least 6 characters for the new password.";
    if (form.newPassword !== form.confirmPassword) next.confirmPassword = "New passwords do not match.";
    if (Object.keys(next).length) return setErrors(next);
    setErrors({});
    setSaving(true);
    try {
      const result = await websiteApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMessage(result.message);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unable to change password.";
      if (/current password|incorrect password/i.test(text)) setErrors({ currentPassword: text });
      else if (/password/i.test(text)) setErrors({ newPassword: text });
      else setMessage(text);
    } finally {
      setSaving(false);
    }
  };

  return <MemberShell title="Change Password" text="Update your account password securely.">
    <section className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50/50 px-5 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-amber-700 shadow-sm"><ShieldCheck className="h-5 w-5" /></span>
        <div><h2 className="text-sm font-semibold text-slate-900">Account security</h2><p className="mt-0.5 text-[11px] text-slate-500">Choose a password you do not use elsewhere.</p></div>
      </div>
      <form onSubmit={submit} noValidate className="max-w-xl space-y-4 p-5">
        <PasswordField label="Current password" value={form.currentPassword} error={errors.currentPassword} onChange={(value) => { setForm({ ...form, currentPassword: value }); setErrors((current) => ({ ...current, currentPassword: "" })); }} />
        <PasswordField label="New password" value={form.newPassword} error={errors.newPassword} onChange={(value) => { setForm({ ...form, newPassword: value }); setErrors((current) => ({ ...current, newPassword: "" })); }} />
        <PasswordField label="Confirm new password" value={form.confirmPassword} error={errors.confirmPassword} onChange={(value) => { setForm({ ...form, confirmPassword: value }); setErrors((current) => ({ ...current, confirmPassword: "" })); }} />
        {message && <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">{message}</p>}
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}Update password</button>
      </form>
    </section>
  </MemberShell>;
};

const PasswordField = ({ label, value, error, onChange }: { label: string; value: string; error?: string; onChange: (value: string) => void }) => {
  const [visible, setVisible] = useState(false);
  return <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    <div className="relative"><input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} className={`w-full rounded-xl border px-3.5 py-2.5 pr-11 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 ${error ? "border-red-400" : "border-slate-200"}`} /><button type="button" onClick={() => setVisible((current) => !current)} className="absolute inset-y-0 right-1 grid w-9 place-items-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-700" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
    {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
  </label>;
};

const Field = ({ label, value, error, onChange }: { label: string; value: string; error?: string; onChange: (value: string) => void }) => (
  <label>
    <span className="mb-1 block text-sm font-semibold text-slate-600">{label}</span>
    <input value={value} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-amber-500 ${error ? "border-amber-500" : "border-slate-200"}`} />
    {error && <p className="mt-1 text-xs text-amber-600">{error}</p>}
  </label>
);

const OrderItemImage = ({ src, name }: { src?: string; name: string }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-amber-100 bg-white">
      {src && !failed
        ? <img src={src} alt={name} onError={() => setFailed(true)} className="h-full w-full object-cover" />
        : <Package className="h-5 w-5 text-amber-500" aria-hidden="true" />}
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-semibold">{value}</p>
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
