import { useEffect, useState } from "react";
import { Check, Clock, Copy, Heart, Minus, Plus, Share2, ShoppingBag, Star, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { readCart, writeCart } from "../lib/cart";
import { productShelves, productSlug } from "./HomePage";
import { SEO } from "./highgrade/shared";
import ZoomableProductImage from "../components/ZoomableProductImage";
import Price from "../components/Price";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const products = productShelves.flatMap((shelf) => shelf.products);
  const product = products.find((item) => productSlug(item.name) === slug) || products[0];
  const gallery = [product.image, ...products.filter((item) => item.name !== product.name).slice(0, 3).map((item) => item.image)];
  const related = products.filter((item) => item.name !== product.name).slice(0, 3);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("Description");
  const [notice, setNotice] = useState("");
  const [recentlyViewed, setRecentlyViewed] = useState<typeof products>([]);
  const price = Number(product.price.replace(/[^\d]/g, "")) || 0;

  useEffect(() => {
    const storageKey = "annai_recently_viewed";
    let stored: string[] = [];
    try {
      stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      stored = [];
    }
    setRecentlyViewed(stored.filter((item) => item !== productSlug(product.name)).map((item) => products.find((candidate) => productSlug(candidate.name) === item)).filter((item): item is typeof products[number] => Boolean(item)).slice(0, 6));
    localStorage.setItem(storageKey, JSON.stringify([productSlug(product.name), ...stored.filter((item) => item !== productSlug(product.name))].slice(0, 12)));
  }, [product.name]);

  const addToCart = () => {
    const key = `jewel-${productSlug(product.name)}`;
    const cart = readCart();
    writeCart({ ...cart, [key]: Number(cart[key] || 0) + quantity });
    localStorage.setItem("annai_cart_products", JSON.stringify({ ...JSON.parse(localStorage.getItem("annai_cart_products") || "{}"), [key]: product }));
    setNotice(`${quantity} item${quantity > 1 ? "s" : ""} added to cart.`);
  };

  return <>
    <SEO title={product.name} description={`Shop ${product.name} from Annai Jewellery. Premium ${product.material}, certified quality and insured delivery.`}/>
    <section className="bg-white px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-7 flex flex-wrap gap-2 text-xs text-slate-500"><Link to="/">Home</Link><span>/</span><Link to="/#new-arrivals">Products</Link><span>/</span><span className="text-amber-700">{product.name}</span></nav>
        <div className="grid gap-9 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="relative">
              <ZoomableProductImage src={gallery[imageIndex]} alt={product.name} className="h-[340px] rounded-[2rem] bg-[#fbf8f1] sm:h-[500px]" />
              <div className="absolute right-4 top-4 z-20 flex gap-2">
                <button type="button" onClick={() => setNotice("Added to your wishlist.")} className="grid h-11 w-11 place-items-center rounded-full border border-amber-200 bg-white/95 text-amber-700 shadow-lg backdrop-blur transition hover:bg-amber-600 hover:text-white" aria-label={`Add ${product.name} to wishlist`} title="Add to wishlist"><Heart className="h-5 w-5"/></button>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(window.location.href); setNotice("Product link copied."); }} className="grid h-11 w-11 place-items-center rounded-full border border-amber-200 bg-white/95 text-amber-700 shadow-lg backdrop-blur transition hover:bg-amber-600 hover:text-white" aria-label={`Share ${product.name}`} title="Share product"><Share2 className="h-5 w-5"/></button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">{gallery.map((image,index)=><button key={`${image}-${index}`} type="button" onClick={()=>setImageIndex(index)} className={`h-24 overflow-hidden rounded-xl border-2 bg-[#fbf8f1] sm:h-32 ${imageIndex===index?"border-amber-500":"border-transparent"}`}><img src={image} alt={`${product.name} gallery ${index+1}`} className="h-full w-full object-contain object-center"/></button>)}</div>
          </div>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="inline-flex rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{product.badge || "New"}</span>
            <h1 className="mt-4 text-3xl font-medium text-slate-900 sm:text-4xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3"><div className="flex text-amber-500">{[0,1,2,3,4].map(star=><Star key={star} className="h-4 w-4 fill-current"/>)}</div><span className="text-sm text-slate-500">12 reviews</span></div>
            <p className="mt-6 text-3xl font-semibold text-slate-900"><Price value={product.price}/></p><p className="mt-1 text-xs text-slate-500">3% GST will be added at checkout</p>
            <div className="mt-5 space-y-2 text-sm"><p><strong>15 sold</strong> in the last 4 hours</p><p className="font-semibold text-amber-700">Please hurry! Only 8 left in stock.</p></div>
            <div className="mt-6"><p className="text-sm font-semibold">Finish: <span className="text-slate-500">24K Gold Plated</span></p></div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#fbf8f1] p-4"><div><p className="text-xs text-slate-500">Subtotal</p><strong className="text-xl"><Price value={price*quantity}/></strong></div><div><p className="mb-2 text-xs font-semibold">Quantity</p><div className="flex items-center rounded-full border border-amber-200 bg-white"><button onClick={()=>setQuantity(q=>Math.max(1,q-1))} className="grid h-10 w-10 place-items-center" aria-label={`Decrease quantity for ${product.name}`}><Minus className="h-4 w-4"/></button><span className="w-10 text-center">{quantity}</span><button onClick={()=>setQuantity(q=>Math.min(8,q+1))} className="grid h-10 w-10 place-items-center" aria-label={`Increase quantity for ${product.name}`}><Plus className="h-4 w-4"/></button></div></div></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={addToCart} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-700"><ShoppingBag className="h-4 w-4"/>Add to cart</button>
              <button onClick={addToCart} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#D4AF37] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#D4AF37]">Buy it now</button>
            </div>
            {notice&&<p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-700"><Check className="mr-2 inline h-4 w-4"/>{notice}</p>}
            <div className="mt-6 space-y-3 border-y border-amber-100 py-5 text-sm text-slate-600"><p><Clock className="mr-2 inline h-4 w-4 text-amber-600"/>Order within 2 hours 27 minutes for priority dispatch.</p><p><Truck className="mr-2 inline h-4 w-4 text-amber-600"/>Estimated delivery in 4-7 working days.</p><p><Copy className="mr-2 inline h-4 w-4 text-amber-600"/>10 customers are viewing this product.</p></div>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex gap-6 overflow-x-auto border-b border-amber-100">{["Description","Additional Information","Shipping & Delivery","Reviews"].map(item=><button key={item} onClick={()=>setTab(item)} className={`shrink-0 border-b-2 px-2 pb-3 text-sm font-semibold ${tab===item?"border-amber-600 text-amber-700":"border-transparent text-slate-500"}`}>{item}</button>)}</div>
          <div className="max-w-4xl py-7 text-sm leading-8 text-slate-600">
            {tab==="Description"&&<ul className="list-disc space-y-1 pl-5"><li>Crafted in genuine 925 silver and finished with a rich layer of 24K gold plating.</li><li>Traditional gold appearance with the comfort and value of a sterling-silver base.</li><li>Each piece is checked for secure stone setting, clasp strength, polish and plating finish.</li><li>Avoid water, perfume, sweat and harsh chemicals to preserve the gold plating.</li><li>Wipe gently after use and store separately in the provided Annai jewellery pouch.</li></ul>}
            {tab==="Additional Information"&&<div className="grid max-w-xl grid-cols-2 gap-3"><strong>Base metal</strong><span>925 Silver</span><strong>Finish</strong><span>24K Gold Plating</span><strong>Availability</strong><span>In stock</span><strong>Vendor</strong><span>Annai Jewellery</span></div>}
            {tab==="Shipping & Delivery"&&<p>All orders are quality checked, securely packed and shipped with insurance. Standard delivery takes 4-7 working days. You will receive tracking details when the order leaves our showroom.</p>}
            {tab==="Reviews"&&<p>Customers rate this product 5.0 out of 5 for its finish, comfort and presentation.</p>}
          </div>
        </div>

        <section className="mt-10"><h2 className="text-3xl font-medium text-slate-900">Related Products</h2><div className="mt-6 grid grid-cols-3 gap-3 sm:gap-5">{related.map(item=><Link key={item.name} to={`/product/${productSlug(item.name)}`} className="overflow-hidden rounded-2xl border border-amber-100 bg-white"><img src={item.image} alt={item.name} className="h-40 w-full object-contain transition hover:scale-105 sm:h-72"/><div className="p-3 sm:p-5"><h3 className="text-xs font-semibold sm:text-base">{item.name}</h3><p className="mt-2 text-xs text-amber-700 sm:text-sm"><Price value={item.price}/></p></div></Link>)}</div></section>
        {recentlyViewed.length>0&&<section className="mt-14 border-t border-amber-100 pt-10"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Picked up where you left off</p><h2 className="mt-2 text-3xl font-medium text-slate-900">Recently Viewed Products</h2></div><Link to="/" className="hidden items-center gap-2 text-sm font-semibold text-amber-700 sm:inline-flex">Continue shopping <span aria-hidden="true">&rarr;</span></Link></div><div className="mt-6 grid grid-cols-3 gap-3 sm:gap-5">{recentlyViewed.map(item=><Link key={item.name} to={`/product/${productSlug(item.name)}`} className="group overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="h-40 overflow-hidden bg-[#fbf8f1] sm:h-64"><img src={item.image} alt={item.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105"/></div><div className="p-3 sm:p-5"><p className="hidden text-[9px] font-semibold uppercase tracking-wider text-amber-600 sm:block">{item.material}</p><h3 className="text-xs font-semibold sm:mt-2 sm:text-base">{item.name}</h3><p className="mt-2 text-xs font-semibold text-amber-700 sm:text-sm"><Price value={item.price}/></p></div></Link>)}</div></section>}
      </div>
    </section>
  </>;
}
