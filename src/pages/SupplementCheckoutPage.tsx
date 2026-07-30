import { useEffect, useState } from "react";
import { CheckCircle2, ImageUp, MapPin, MessageCircle, QrCode, ShieldCheck, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { readCart, writeCart } from "../lib/cart";
import { productShelves, productSlug, type Product } from "./HomePage";
import Price from "../components/Price";
import { SEO } from "../components/JewelleryUI";
import { websiteApi, type WebsiteAddress } from "../lib/api";

type PaymentMethod = "whatsapp" | "upi" | "gpay" | "qr";
const upiId = "annaijewellery@upi";
const whatsappNumber = "919751229418";

const savedCartProducts = () => {
  try { return JSON.parse(localStorage.getItem("annai_cart_products") || "{}") as Record<string, Product>; }
  catch { return {}; }
};

const storedProfile = () => {
  try { return JSON.parse(localStorage.getItem("annai_user_profile") || "{}") as { id?: string | number; name?: string; email?: string; phone?: string; address?: string }; }
  catch { return {}; }
};

export default function SupplementCheckoutPage() {
  const initialProfile = storedProfile();
  const initialAddress = initialProfile.address?.trim() || "";
  const [cart, setCart] = useState(readCart);
  const [method, setMethod] = useState<PaymentMethod>("whatsapp");
  const [name, setName] = useState(initialProfile.name || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [email, setEmail] = useState(initialProfile.email || "");
  const [savedAddress, setSavedAddress] = useState(initialAddress);
  const [savedAddresses, setSavedAddresses] = useState<WebsiteAddress[]>(
    initialAddress ? [{ id: 0, label: "Default address", address: initialAddress, isDefault: true }] : [],
  );
  const [addressMode, setAddressMode] = useState<"saved" | "new">(initialAddress ? "saved" : "new");
  const [address, setAddress] = useState(initialAddress);
  const [newAddress, setNewAddress] = useState("");
  const [signedIn, setSignedIn] = useState(Boolean(initialProfile.id));
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [discount, setDiscount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const productsByKey = savedCartProducts();
  const catalogue = productShelves.flatMap((shelf) => shelf.products);
  useEffect(() => {
    let active = true;
    websiteApi.profile()
      .then(async (profile) => {
        if (!active) return;
        const profileAddress = profile.address?.trim() || "";
        let addressBook: WebsiteAddress[] = [];
        try {
          addressBook = (await websiteApi.addresses()).addresses || [];
          const localAddresses = JSON.parse(localStorage.getItem(`annai_addresses_${profile.id}`) || "[]") as string[];
          for (const localAddress of localAddresses) {
            const value = String(localAddress || "").trim();
            if (value.length >= 8 && !addressBook.some((item) => item.address.trim().toLowerCase() === value.toLowerCase())) {
              try {
                const created = await websiteApi.createAddress({ address: value, isDefault: addressBook.length === 0 });
                addressBook = [...addressBook, created];
              } catch {
                // Keep loading the rest of the account even if one legacy address cannot be migrated.
              }
            }
          }
          localStorage.removeItem(`annai_addresses_${profile.id}`);
          if (!addressBook.length && profileAddress) {
            const created = await websiteApi.createAddress({ address: profileAddress, isDefault: true });
            addressBook = [created];
          }
        } catch {
          if (profileAddress) {
            addressBook = [{ id: 0, label: "Default address", address: profileAddress, isDefault: true }];
          }
        }
        addressBook.sort((left, right) => Number(right.isDefault) - Number(left.isDefault));
        const preferredAddress = addressBook.find((item) => item.isDefault)?.address || addressBook[0]?.address || profileAddress;
        if (!active) return;
        setSignedIn(true);
        setName(profile.name || "");
        setPhone(profile.phone || "");
        setEmail(profile.email || "");
        setSavedAddresses(addressBook);
        setSavedAddress(preferredAddress);
        if (preferredAddress) {
          setAddressMode("saved");
          setAddress(preferredAddress);
        } else {
          setAddressMode("new");
          setAddress("");
          setNewAddress("");
        }
        localStorage.setItem("annai_user_profile", JSON.stringify(profile));
      })
      .catch(() => {
        if (!active) return;
        setSignedIn(false);
        if (!storedProfile().address?.trim()) {
          setSavedAddresses([]);
          setSavedAddress("");
          setAddressMode("new");
        }
      });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    websiteApi.products()
      .then(({ products }) => {
        if (!active) return;
        setLiveProducts(products.map((item) => ({
          id: item.id,
          name: item.name,
          material: item.material || "925 Silver with 24K Gold Plating",
          price: String(item.price),
          image: item.image || item.imageUrl || "",
          images: item.images,
          badge: item.badge,
          description: item.description,
          category: item.category,
          rating: item.rating,
          reviewCount: item.reviewCount,
          relatedProductIds: item.relatedProductIds,
          stock: item.stock,
          inStock: item.inStock,
        })));
      })
      .catch(() => { /* the server validates price and stock again when the order is submitted */ });
    return () => { active = false; };
  }, []);
  const items = Object.entries(cart).map(([key,quantity]) => {
    const savedProduct = productsByKey[key] || catalogue.find((item)=>`jewel-${productSlug(item.name)}`===key);
    const product = (savedProduct?.id ? liveProducts.find((item) => String(item.id) === String(savedProduct.id)) : null) || savedProduct;
    return product ? { key, product, quantity:Number(quantity) } : null;
  }).filter((item): item is {key:string;product:Product;quantity:number}=>Boolean(item));
  const subtotal = items.reduce((sum,item)=>sum+Number(item.product.price.replace(/[^\d]/g,""))*item.quantity,0);
  const deliveryFee = subtotal ? 0 : 0;
  const total = Math.max(subtotal + deliveryFee - discount, 0);
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("Annai Jewellery")}&am=${total}&cu=INR&tn=${encodeURIComponent("Annai jewellery order")}`;

  const orderText = () => [
    "*New Annai Jewellery Order*",
    `Customer: ${name}`,
    `Phone: ${phone}`,
    `Address: ${address}`,
    "",
    ...items.map(({product,quantity})=>`${product.name} x ${quantity} - Rs. ${(Number(product.price.replace(/[^\d]/g,""))*quantity).toLocaleString("en-IN")}`),
    "",
    `Total: Rs. ${total.toLocaleString("en-IN")}`,
    `Payment: ${method.toUpperCase()}`,
    screenshot ? `Payment screenshot selected: ${screenshot.name}` : "",
  ].filter(Boolean).join("\n");

  const validate = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter your full name.";
    if (!/^\d{10}$/.test(phone.replace(/\D/g,""))) next.phone = "Enter a valid 10 digit phone number.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (address.trim().length < 8) next.address = "Enter a complete delivery address.";
    if (!screenshot) next.screenshot = "Upload your payment screenshot.";
    else if (screenshot.size > 5 * 1024 * 1024) next.screenshot = "Payment screenshot must be under 5 MB.";
    if (!items.length) next.cart = "Your cart is empty.";
    else if (items.some(({ product }) => !product.id)) next.cart = "A product in your cart is no longer available. Remove it and add it again.";
    return next;
  };

  const screenshotData = () => new Promise<string>((resolve, reject) => {
    if (!screenshot) return reject(new Error("Payment screenshot is required."));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the payment screenshot."));
    reader.readAsDataURL(screenshot);
  });

  const saveAddressToAccount = async () => {
    const value = address.trim();
    setAddressMessage("");
    if (value.length < 8) {
      setFieldErrors((current) => ({ ...current, address: "Enter a complete delivery address." }));
      return;
    }
    if (!signedIn) {
      setAddressMessage("Sign in to save this address to your account.");
      return;
    }
    setSavingAddress(true);
    try {
      const created = await websiteApi.createAddress({
        address: value,
        isDefault: savedAddresses.length === 0,
      });
      const response = await websiteApi.addresses();
      const nextAddresses = response.addresses || [created];
      setSavedAddresses(nextAddresses);
      setSavedAddress(created.address);
      setAddress(created.address);
      setNewAddress("");
      setAddressMode("saved");
      setAddressMessage("Address saved to your account.");
      setFieldErrors((current) => ({ ...current, address: "" }));
      if (created.isDefault) {
        const nextProfile = { ...storedProfile(), address: created.address };
        localStorage.setItem("annai_user_profile", JSON.stringify(nextProfile));
      }
    } catch (reason) {
      setAddressMessage(reason instanceof Error ? reason.message : "Unable to save this address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const completeOrder = async () => {
    const validation = validate();
    if (Object.keys(validation).length) { setFieldErrors(validation); setError(""); return false; }
    setFieldErrors({});
    setBusy(true); setError("");
    try {
      const paymentProof = await screenshotData();
      const order = await websiteApi.createOrder({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        deliveryAddress: address,
        paymentMethod: method === "whatsapp" ? "WHATSAPP" : method.toUpperCase(),
        paymentProof,
        couponCode: couponCode.trim(),
        idempotencyKey: `annai_${Date.now()}_${crypto.getRandomValues(new Uint32Array(2)).join("_")}`,
        items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      });
      writeCart({});
      setCart({});
      setSuccess(`Order ${order.orderId} was submitted for payment verification.`);
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" }));
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to place the order.");
      return false;
    } finally { setBusy(false); }
  };

  const placeViaWhatsApp = async () => {
    if (await completeOrder()) window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderText())}`, "_blank", "noopener,noreferrer");
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const result = await websiteApi.validateCoupon({ code: couponCode, subtotal, email });
      setDiscount(result.discount); setCouponMessage(result.message);
    } catch (reason) { setDiscount(0); setCouponMessage(reason instanceof Error ? reason.message : "Coupon is not valid."); }
  };

  return <section className={`min-h-screen bg-[#fbf8f1] px-4 sm:px-6 lg:px-10 ${success ? "py-4 sm:py-6" : "py-6 sm:py-8"}`}>
    <SEO title="Secure Checkout" description="Complete your Annai Jewellery order through WhatsApp, UPI, GPay or QR payment."/>
    <div className="mx-auto max-w-6xl">
      {!success && <div className="storefront-page-header"><p className="storefront-page-kicker">Secure checkout</p><h1 className="storefront-page-title">Complete your order</h1><p className="storefront-page-copy">Choose the payment method that is easiest for you.</p></div>}
      {success ? <div className="rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-sm sm:p-8"><CheckCircle2 className="mx-auto h-11 w-11 text-amber-600"/><h1 className="storefront-page-title !mt-3">Thank you for your order</h1><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{success}</p><Link to="/" className="mt-5 inline-flex rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white">Continue shopping</Link></div> :
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-600 text-xs font-bold text-white">1</span>
              <div><h2 className="text-lg font-semibold">Delivery details</h2><p className="text-xs text-slate-500">Where should we deliver your jewellery?</p></div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">Full name
                <input value={name} onChange={(event)=>{setName(event.target.value);setFieldErrors((current)=>({...current,name:""}));}} aria-invalid={Boolean(fieldErrors.name)} className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-amber-500 ${fieldErrors.name?"border-red-400":"border-amber-200"}`}/>
                {fieldErrors.name&&<span className="mt-1.5 block text-xs font-medium text-red-600">{fieldErrors.name}</span>}
              </label>
              <label className="text-xs font-semibold text-slate-600">Phone number
                <input value={phone} onChange={(event)=>{setPhone(event.target.value.replace(/\D/g,"").slice(0,10));setFieldErrors((current)=>({...current,phone:""}));}} aria-invalid={Boolean(fieldErrors.phone)} className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-amber-500 ${fieldErrors.phone?"border-red-400":"border-amber-200"}`}/>
                {fieldErrors.phone&&<span className="mt-1.5 block text-xs font-medium text-red-600">{fieldErrors.phone}</span>}
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Email address
                <input type="email" value={email} onChange={(event)=>{setEmail(event.target.value);setFieldErrors((current)=>({...current,email:""}));}} aria-invalid={Boolean(fieldErrors.email)} className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-amber-500 ${fieldErrors.email?"border-red-400":"border-amber-200"}`}/>
                {fieldErrors.email&&<span className="mt-1.5 block text-xs font-medium text-red-600">{fieldErrors.email}</span>}
              </label>
              <fieldset className="min-w-0 sm:col-span-2">
                <legend className="text-xs font-semibold text-slate-600">Delivery address</legend>
                {savedAddresses.length > 0 && <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {savedAddresses.map((item) => <button key={item.id} type="button" onClick={()=>{setAddressMode("saved");setSavedAddress(item.address);setAddress(item.address);setAddressMessage("");setFieldErrors((current)=>({...current,address:""}));}} className={`rounded-2xl border p-4 text-left transition ${addressMode==="saved"&&address===item.address?"border-amber-500 bg-amber-50 shadow-sm":"border-amber-100 bg-white hover:border-amber-300"}`}>
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-800"><MapPin className="h-4 w-4 text-amber-600"/>{item.isDefault?"Default address":item.label || "Saved address"}{addressMode==="saved"&&address===item.address&&<CheckCircle2 className="ml-auto h-4 w-4 text-amber-600"/>}</span>
                    <span className="mt-2 block text-xs font-normal leading-5 text-slate-600">{item.address}</span>
                  </button>)}
                  <button type="button" onClick={()=>{setAddressMode("new");setAddress(newAddress);setAddressMessage("");setFieldErrors((current)=>({...current,address:""}));}} className={`rounded-2xl border p-4 text-left transition ${addressMode==="new"?"border-amber-500 bg-amber-50 shadow-sm":"border-amber-100 bg-white hover:border-amber-300"}`}>
                    <span className="block text-xs font-bold text-slate-800">Use a new address</span>
                    <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Enter a different delivery location.</span>
                  </button>
                </div>}
                {addressMode==="new"&&<div className={savedAddresses.length?"mt-3":"mt-2"}>
                  <textarea value={address} onChange={(event)=>{setAddress(event.target.value);setNewAddress(event.target.value);setAddressMessage("");setFieldErrors((current)=>({...current,address:""}));}} placeholder="House number, street, area, city and PIN code" aria-invalid={Boolean(fieldErrors.address)} className={`min-h-24 w-full resize-y rounded-xl border px-4 py-3 text-sm outline-none focus:border-amber-500 ${fieldErrors.address?"border-red-400":"border-amber-200"}`}/>
                  {signedIn&&address.trim()!==savedAddress.trim()&&<div className="mt-3 flex flex-col gap-3 rounded-xl bg-amber-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-slate-600"><strong className="block text-slate-800">Save for future orders?</strong>Keep this delivery address in your Annai account.</span>
                    <button type="button" disabled={savingAddress} onClick={saveAddressToAccount} className="shrink-0 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{savingAddress?"Saving...":"Save address"}</button>
                  </div>}
                  {!signedIn&&address.trim().length>=8&&<p className="mt-2 text-xs text-slate-500"><Link to="/login" className="font-semibold text-amber-700">Sign in</Link> to save this address for future orders.</p>}
                </div>}
                {fieldErrors.address&&<span className="mt-1.5 block text-xs font-medium text-red-600">{fieldErrors.address}</span>}
                {addressMessage&&<span className={`mt-2 block text-xs font-medium ${/saved/i.test(addressMessage)?"text-emerald-700":"text-red-600"}`}>{addressMessage}</span>}
              </fieldset>
            </div>
          </section>
          <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-amber-600 text-xs font-bold text-white">2</span><div><h2 className="text-lg font-semibold">Payment method</h2><p className="text-xs text-slate-500">Choose one secure payment option.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[
            ["whatsapp",MessageCircle,"Order through WhatsApp","Share order directly with our team"],
            ["upi",Smartphone,"UPI Payment",`Pay to ${upiId}`],
            ["gpay",Smartphone,"Google Pay","Open GPay or another UPI app"],
            ["qr",QrCode,"Scan QR Code","Scan, pay and upload confirmation"],
          ].map(([id,Icon,title,text])=><button key={id as string} onClick={()=>setMethod(id as PaymentMethod)} className={`flex min-h-[92px] items-start gap-3 rounded-2xl border p-4 text-left transition ${method===id?"border-amber-500 bg-amber-50 shadow-sm":"border-amber-100 hover:border-amber-300"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700 shadow-sm"><Icon className="h-5 w-5"/></span><span><strong className="block text-sm">{title as string}</strong><small className="mt-1 block leading-5 text-slate-500">{text as string}</small></span></button>)}</div>
            {method==="whatsapp"&&<div className="mt-6 rounded-2xl bg-[#fbf8f1] p-5"><p className="text-sm font-semibold">Upload your payment screenshot</p><p className="mt-1 text-xs text-slate-500">The order will be saved for verification before WhatsApp opens.</p><label className={`mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-white p-4 ${fieldErrors.screenshot?"border-red-400":"border-amber-300"}`}><ImageUp className="h-5 w-5 text-amber-600"/><span className="text-xs"><strong className="block">Choose payment screenshot</strong><span className="mt-1 block text-slate-500">{screenshot?.name || "JPG, PNG or WEBP · Max 5 MB"}</span></span><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event)=>{const file=event.target.files?.[0]||null;setScreenshot(file);setFieldErrors((current)=>({...current,screenshot:file&&file.size>5*1024*1024?"Payment screenshot must be under 5 MB.":""}));}}/></label>{fieldErrors.screenshot&&<p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.screenshot}</p>}{screenshot&&<button type="button" onClick={()=>{setScreenshot(null);setFieldErrors((current)=>({...current,screenshot:"Upload your payment screenshot."}));}} className="mt-2 text-xs font-semibold text-amber-700">Remove screenshot</button>}</div>}
            {method!=="whatsapp"&&<div className="mt-6 rounded-2xl bg-[#fbf8f1] p-5">{method==="qr"?<div className="flex flex-col items-center gap-4 sm:flex-row"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`} alt="Annai Jewellery UPI payment QR code" className="h-40 w-40 rounded-xl border border-amber-200 bg-white p-2"/><div><p className="text-sm font-semibold">Scan and pay <Price value={total}/></p><p className="mt-2 text-xs text-slate-500">UPI ID: {upiId}</p></div></div>:<div><p className="text-sm font-semibold">Pay <Price value={total}/> using {method==="gpay"?"Google Pay":"any UPI app"}</p><a href={upiLink} className="mt-4 inline-flex rounded-full bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white">Open payment app</a><p className="mt-3 text-xs text-slate-500">UPI ID: {upiId}</p></div>}
              <label className={`mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-white p-4 ${fieldErrors.screenshot?"border-red-400":"border-amber-300"}`}><ImageUp className="h-5 w-5 text-amber-600"/><span className="text-xs"><strong className="block">Upload payment screenshot</strong><span className="mt-1 block text-slate-500">{screenshot?.name || "JPG, PNG or WEBP · Max 5 MB"}</span></span><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event)=>{const file=event.target.files?.[0]||null;setScreenshot(file);setFieldErrors((current)=>({...current,screenshot:file&&file.size>5*1024*1024?"Payment screenshot must be under 5 MB.":""}));}}/></label>
              {fieldErrors.screenshot&&<p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.screenshot}</p>}
              {screenshot&&<button type="button" onClick={()=>{setScreenshot(null);setFieldErrors((current)=>({...current,screenshot:"Upload your payment screenshot."}));}} className="mt-2 text-xs font-semibold text-amber-700">Remove screenshot</button>}
            </div>}
          </section>
        </div>
        <aside className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm lg:sticky lg:top-28"><h2 className="text-lg font-semibold">Order summary</h2><div className="mt-5 space-y-4">{items.map(({key,product,quantity})=><div key={key} className="flex gap-3"><img src={product.image} alt={product.name} className="h-14 w-14 rounded-xl object-contain"/><div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-semibold">{product.name}</p><p className="mt-1 text-xs text-slate-500">Qty {quantity}</p></div><Price value={Number(product.price.replace(/[^\d]/g,""))*quantity} className="text-xs font-semibold"/></div>)}</div>{fieldErrors.cart&&<p className="mt-2 text-xs font-medium text-red-600">{fieldErrors.cart}</p>}<div className="mt-5 flex gap-2 border-t border-amber-100 pt-5"><input value={couponCode} onChange={(event)=>{setCouponCode(event.target.value.toUpperCase());setDiscount(0);setCouponMessage("");}} placeholder="Coupon code" className="min-w-0 flex-1 rounded-xl border border-amber-200 px-3 py-2 text-xs outline-none"/><button onClick={applyCoupon} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Apply</button></div>{couponMessage&&<p className={`mt-2 text-xs ${discount?"text-emerald-700":"text-red-600"}`}>{couponMessage}</p>}{discount>0&&<div className="mt-4 flex justify-between text-sm text-emerald-700"><span>Discount</span><span>-₹{discount.toLocaleString("en-IN")}</span></div>}<div className="mt-5 flex justify-between border-t border-amber-100 pt-5 text-lg font-semibold"><span>Total</span><Price value={total}/></div>{error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}<button disabled={busy} onClick={method==="whatsapp"?placeViaWhatsApp:completeOrder} className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{method==="whatsapp"?<MessageCircle className="h-4 w-4"/>:<ShieldCheck className="h-4 w-4"/>}{busy?"Submitting...":method==="whatsapp"?"Place order on WhatsApp":"Submit paid order"}</button>{method!=="whatsapp"&&<a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderText())}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-amber-700"><MessageCircle className="h-4 w-4"/>Send screenshot through WhatsApp</a>}<Link to="/cart" className="mt-4 block text-xs text-slate-500">Back to cart</Link><p className="mt-5 text-xs leading-6 text-slate-500"><MapPin className="mr-1 inline h-4 w-4 text-amber-600"/>Free insured delivery. Payment is manually verified before dispatch.</p></aside>
      </div>}
    </div>
  </section>;
}
