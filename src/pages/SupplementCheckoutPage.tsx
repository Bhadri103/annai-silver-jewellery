import { useMemo, useState } from "react";
import { CheckCircle2, ImageUp, MapPin, MessageCircle, QrCode, ShieldCheck, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { readCart, writeCart } from "../lib/cart";
import { productShelves, productSlug, type Product } from "./HomePage";
import Price from "../components/Price";
import { SEO } from "./highgrade/shared";

type PaymentMethod = "whatsapp" | "upi" | "gpay" | "qr";
const upiId = "annaijewellery@upi";
const whatsappNumber = "919123456789";

const savedCartProducts = () => {
  try { return JSON.parse(localStorage.getItem("annai_cart_products") || "{}") as Record<string, Product>; }
  catch { return {}; }
};

export default function SupplementCheckoutPage() {
  const [cart, setCart] = useState(readCart);
  const [method, setMethod] = useState<PaymentMethod>("whatsapp");
  const [name, setName] = useState(() => { try { return JSON.parse(localStorage.getItem("highgrade_user_profile") || "{}").name || ""; } catch { return ""; } });
  const [phone, setPhone] = useState(() => { try { return JSON.parse(localStorage.getItem("highgrade_user_profile") || "{}").phone || ""; } catch { return ""; } });
  const [address, setAddress] = useState(() => { try { return JSON.parse(localStorage.getItem("highgrade_user_profile") || "{}").address || ""; } catch { return ""; } });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const productsByKey = savedCartProducts();
  const catalogue = productShelves.flatMap((shelf) => shelf.products);
  const items = useMemo(() => Object.entries(cart).map(([key,quantity]) => {
    const product = productsByKey[key] || catalogue.find((item)=>`jewel-${productSlug(item.name)}`===key);
    return product ? { key, product, quantity:Number(quantity) } : null;
  }).filter((item): item is {key:string;product:Product;quantity:number}=>Boolean(item)), [cart]);
  const subtotal = items.reduce((sum,item)=>sum+Number(item.product.price.replace(/[^\d]/g,""))*item.quantity,0);
  const deliveryFee = subtotal ? 0 : 0;
  const total = subtotal + deliveryFee;
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
    if (!items.length) return "Your cart is empty.";
    if (name.trim().length < 2) return "Enter your full name.";
    if (!/^\d{10}$/.test(phone.replace(/\D/g,""))) return "Enter a valid 10 digit phone number.";
    if (address.trim().length < 8) return "Enter a complete delivery address.";
    if (method !== "whatsapp" && !screenshot) return "Upload your payment screenshot before placing the order.";
    return "";
  };

  const completeOrder = () => {
    const validation = validate();
    if (validation) { setError(validation); return false; }
    const order = { id:`AN${Date.now()}`, name, phone, address, items, total, method, screenshot:screenshot?.name || "", createdAt:new Date().toISOString(), status:"Payment verification pending" };
    const previous = JSON.parse(localStorage.getItem("annai_offline_orders") || "[]");
    localStorage.setItem("annai_offline_orders", JSON.stringify([order,...previous]));
    writeCart({}); setCart({}); setError(""); setSuccess(`Order ${order.id} placed successfully. We will confirm it through WhatsApp.`);
    return true;
  };

  const placeViaWhatsApp = () => {
    const validation = validate();
    if (validation) { setError(validation); return; }
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderText())}`, "_blank", "noopener,noreferrer");
    completeOrder();
  };

  return <section className="min-h-screen bg-[#fbf8f1] px-4 pb-16 pt-28 sm:px-6 lg:px-10">
    <SEO title="Secure Checkout" description="Complete your Annai Jewellery order through WhatsApp, UPI, GPay or QR payment."/>
    <div className="mx-auto max-w-6xl">
      <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">Secure checkout</p><h1 className="mt-2 text-4xl font-semibold">Complete your order</h1><p className="mt-2 text-sm text-slate-500">Choose the payment method that is easiest for you.</p></div>
      {success ? <div className="rounded-3xl border border-amber-200 bg-white p-10 text-center shadow-sm"><CheckCircle2 className="mx-auto h-12 w-12 text-amber-600"/><h2 className="mt-4 text-2xl font-semibold">Thank you for your order</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">{success}</p><Link to="/" className="mt-6 inline-flex rounded-full bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white">Continue shopping</Link></div> :
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-amber-600 text-xs font-bold text-white">1</span><div><h2 className="text-lg font-semibold">Delivery details</h2><p className="text-xs text-slate-500">Where should we deliver your jewellery?</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Full name<input value={name} onChange={(event)=>setName(event.target.value)} className="mt-2 w-full rounded-xl border border-amber-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"/></label><label className="text-xs font-semibold text-slate-600">Phone number<input value={phone} onChange={(event)=>setPhone(event.target.value.replace(/\D/g,"").slice(0,10))} className="mt-2 w-full rounded-xl border border-amber-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"/></label><label className="text-xs font-semibold text-slate-600 sm:col-span-2">Delivery address<textarea value={address} onChange={(event)=>setAddress(event.target.value)} className="mt-2 min-h-20 w-full resize-y rounded-xl border border-amber-200 px-4 py-3 text-sm outline-none focus:border-amber-500"/></label></div></section>
          <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-amber-600 text-xs font-bold text-white">2</span><div><h2 className="text-lg font-semibold">Payment method</h2><p className="text-xs text-slate-500">Choose one secure payment option.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[
            ["whatsapp",MessageCircle,"Order through WhatsApp","Share order directly with our team"],
            ["upi",Smartphone,"UPI Payment",`Pay to ${upiId}`],
            ["gpay",Smartphone,"Google Pay","Open GPay or another UPI app"],
            ["qr",QrCode,"Scan QR Code","Scan, pay and upload confirmation"],
          ].map(([id,Icon,title,text])=><button key={id as string} onClick={()=>setMethod(id as PaymentMethod)} className={`flex min-h-[92px] items-start gap-3 rounded-2xl border p-4 text-left transition ${method===id?"border-amber-500 bg-amber-50 shadow-sm":"border-amber-100 hover:border-amber-300"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700 shadow-sm"><Icon className="h-5 w-5"/></span><span><strong className="block text-sm">{title as string}</strong><small className="mt-1 block leading-5 text-slate-500">{text as string}</small></span></button>)}</div>
            {method!=="whatsapp"&&<div className="mt-6 rounded-2xl bg-[#fbf8f1] p-5">{method==="qr"?<div className="flex flex-col items-center gap-4 sm:flex-row"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`} alt="Annai Jewellery UPI payment QR code" className="h-40 w-40 rounded-xl border border-amber-200 bg-white p-2"/><div><p className="text-sm font-semibold">Scan and pay <Price value={total}/></p><p className="mt-2 text-xs text-slate-500">UPI ID: {upiId}</p></div></div>:<div><p className="text-sm font-semibold">Pay <Price value={total}/> using {method==="gpay"?"Google Pay":"any UPI app"}</p><a href={upiLink} className="mt-4 inline-flex rounded-full bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white">Open payment app</a><p className="mt-3 text-xs text-slate-500">UPI ID: {upiId}</p></div>}
              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-white p-4"><ImageUp className="h-5 w-5 text-amber-600"/><span className="text-xs"><strong className="block">Upload payment screenshot</strong><span className="mt-1 block text-slate-500">{screenshot?.name || "JPG, PNG or WEBP"}</span></span><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event)=>setScreenshot(event.target.files?.[0]||null)}/></label>
              {screenshot&&<button onClick={()=>setScreenshot(null)} className="mt-2 text-xs font-semibold text-amber-700">Remove screenshot</button>}
            </div>}
          </section>
        </div>
        <aside className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm lg:sticky lg:top-28"><h2 className="text-lg font-semibold">Order summary</h2><div className="mt-5 space-y-4">{items.map(({key,product,quantity})=><div key={key} className="flex gap-3"><img src={product.image} alt={product.name} className="h-14 w-14 rounded-xl object-contain"/><div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-semibold">{product.name}</p><p className="mt-1 text-xs text-slate-500">Qty {quantity}</p></div><Price value={Number(product.price.replace(/[^\d]/g,""))*quantity} className="text-xs font-semibold"/></div>)}</div><div className="mt-5 flex justify-between border-t border-amber-100 pt-5 text-lg font-semibold"><span>Total</span><Price value={total}/></div>{error&&<p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">{error}</p>}<button onClick={method==="whatsapp"?placeViaWhatsApp:completeOrder} className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white">{method==="whatsapp"?<MessageCircle className="h-4 w-4"/>:<ShieldCheck className="h-4 w-4"/>}{method==="whatsapp"?"Place order on WhatsApp":"Submit paid order"}</button>{method!=="whatsapp"&&<a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderText())}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-amber-700"><MessageCircle className="h-4 w-4"/>Send screenshot through WhatsApp</a>}<Link to="/cart" className="mt-4 block text-xs text-slate-500">Back to cart</Link><p className="mt-5 text-xs leading-6 text-slate-500"><MapPin className="mr-1 inline h-4 w-4 text-amber-600"/>Free insured delivery. Payment is manually verified before dispatch.</p></aside>
      </div>}
    </div>
  </section>;
}
