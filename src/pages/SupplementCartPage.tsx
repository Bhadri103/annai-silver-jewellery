import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { cartCount, readCart, writeCart } from "../lib/cart";
import { productShelves, productSlug, type Product } from "./HomePage";
import Price from "../components/Price";
import { SEO } from "../components/JewelleryUI";

const storedProducts = () => {
  try { return JSON.parse(localStorage.getItem("annai_cart_products") || "{}") as Record<string, Product>; }
  catch { return {}; }
};

export default function SupplementCartPage() {
  const [cart, setCart] = useState(readCart);
  const [savedProducts, setSavedProducts] = useState(storedProducts);
  const catalogue = productShelves.flatMap((shelf) => shelf.products);

  useEffect(() => { writeCart(cart); setSavedProducts(storedProducts()); }, [cart]);

  const items = useMemo(() => Object.entries(cart).map(([key, quantity]) => {
    const product = savedProducts[key] || catalogue.find((item) => `jewel-${productSlug(item.name)}` === key);
    return product ? { key, product, quantity: Number(quantity) } : null;
  }).filter((item): item is { key: string; product: Product; quantity: number } => Boolean(item)), [cart, savedProducts]);

  const subtotal = items.reduce((sum, item) => sum + Number(item.product.price.replace(/[^\d]/g, "")) * item.quantity, 0);
  const update = (key: string, quantity: number) => setCart((current) => {
    const next = { ...current };
    if (quantity > 0) next[key] = Math.min(quantity, 8); else delete next[key];
    return next;
  });

  return <section className="min-h-screen bg-[#fbf8f1] px-4 pb-16 pt-28 sm:px-6 lg:px-10">
    <SEO title="Shopping Cart" description="Review jewellery selected for your Annai order."/>
    <div className="mx-auto max-w-6xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">Your selection</p><h1 className="mt-2 text-4xl font-semibold">Shopping Cart</h1><p className="mt-2 text-sm text-slate-500">{cartCount(cart)} item(s) reserved for checkout</p></div><Link to="/collection/indian-jewellery" className="rounded-full border border-amber-300 px-5 py-2.5 text-xs font-semibold">Continue shopping</Link></div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-amber-100 bg-white p-4 shadow-sm">
          {items.length ? <div className="divide-y divide-amber-100">{items.map(({key,product,quantity})=><article key={key} className="grid grid-cols-[82px_minmax(0,1fr)] gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5"><img src={product.image} alt={product.name} className="h-20 w-20 rounded-2xl bg-[#fbf8f1] object-contain sm:h-28 sm:w-28"/><div className="min-w-0"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">{product.material}</p><Link to={`/product/${productSlug(product.name)}`} className="mt-1 block truncate text-sm font-semibold sm:text-base">{product.name}</Link></div><button onClick={()=>update(key,0)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-amber-100 text-amber-700" aria-label={`Remove ${product.name}`}><Trash2 className="h-3.5 w-3.5"/></button></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><Price value={Number(product.price.replace(/[^\d]/g,""))*quantity} className="text-sm font-semibold sm:text-base"/><div className="inline-flex shrink-0 items-center rounded-full border border-amber-300 bg-white"><button onClick={()=>update(key,quantity-1)} className="grid h-9 w-9 place-items-center" aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5"/></button><span className="w-7 text-center text-sm font-semibold">{quantity}</span><button onClick={()=>update(key,quantity+1)} className="grid h-9 w-9 place-items-center" aria-label="Increase quantity"><Plus className="h-3.5 w-3.5"/></button></div></div><p className="mt-2 text-[10px] text-slate-500"><Price value={product.price}/> each</p></div></article>)}</div>:<div className="py-16 text-center"><ShoppingBag className="mx-auto h-10 w-10 text-amber-500"/><h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2><Link to="/collection/new-arrivals" className="mt-5 inline-flex rounded-full bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white">Explore jewellery</Link></div>}
        </div>
        <aside className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Order summary</p><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Items</span><span>{cartCount(cart)}</span></div><div className="flex justify-between"><span className="text-slate-500">Insured delivery</span><span>Calculated next</span></div><div className="flex justify-between border-t border-amber-100 pt-4 text-lg font-semibold"><span>Subtotal</span><Price value={subtotal}/></div></div>{items.length>0&&<Link to="/checkout" className="mt-6 inline-flex items-center rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white">Proceed to checkout</Link>}<p className="mt-5 text-xs leading-6 text-slate-500"><ShieldCheck className="mr-1 inline h-4 w-4 text-amber-600"/>Secure checkout and insured jewellery delivery.</p></aside>
      </div>
    </div>
  </section>;
}
