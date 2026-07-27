import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Gem, Heart, Home, Menu, Search, ShoppingBag, ShoppingCart, UserRound, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { cartCount, cartUpdatedEvent, readCart } from "../lib/cart";
import { productShelves, productSlug } from "../pages/HomePage";

const primaryItems = [
  ["Home", "/"],
  ["New Arrivals", "/collection/new-arrivals"],
  ["Best Sellers", "/collection/best-sellers"],
  ["Bangles", "/collection/bangles"],
  ["Necklaces", "/collection/necklaces"],
  ["Earrings", "/collection/earrings"],
  ["Chains", "/collection/chains"],
];

const allMenuItems = [
  ...primaryItems.slice(1),
  ["Chain Bracelets", "/collection/chain-bracelets"],
  ["Kada Bracelets", "/collection/kada-bracelets"],
  ["Anklets", "/collection/anklets"],
  ["Bridal Jewellery", "/collection/bridal-jewellery"],
  ["Antique Jewellery", "/collection/antique-jewellery"],
  ["Stone Jewellery", "/collection/stone-jewellery"],
  ["24K Gold-Plated Jewellery", "/collection/gold-plated-jewellery"],
  ["925 Silver Jewellery", "/collection/silver-jewellery"],
  ["Indian Jewellery", "/collection/indian-jewellery"],
  ["About Annai", "/about"],
  ["Contact Us", "/contact"],
];

const Header: React.FC = () => {
  const [drawer, setDrawer] = useState<"menu" | "search" | null>(null);
  const [query, setQuery] = useState("");
  const [memberName, setMemberName] = useState("");
  const [cartItems, setCartItems] = useState(() => cartCount(readCart()));
  const location = useLocation();
  const products = productShelves.flatMap((shelf) => shelf.products);
  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? products.filter((product) => `${product.name} ${product.material}`.toLowerCase().includes(term)).slice(0, 7) : [];
  }, [query]);
  const closeDrawer = () => setDrawer(null);
  const accountPath = memberName ? "/profile" : "/login";

  useEffect(() => {
    const sync = () => {
      try { setMemberName(JSON.parse(localStorage.getItem("annai_user_profile") || "null")?.name || ""); }
      catch { setMemberName(""); }
      setCartItems(cartCount(readCart()));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("annai-user-session", sync);
    window.addEventListener(cartUpdatedEvent, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("annai-user-session", sync);
      window.removeEventListener(cartUpdatedEvent, sync);
    };
  }, []);

  useEffect(() => {
    if (!drawer) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [drawer]);

  return <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-amber-200 bg-white shadow-[0_5px_22px_rgba(78,52,18,0.12)]">
      <div className="mx-auto hidden h-[96px] max-w-7xl items-center gap-5 px-6 lg:flex lg:px-10">
        <Link to="/" className="flex h-[92px] w-[104px] shrink-0 items-center justify-center" aria-label="Annai Jewellery home"><span className="grid h-[86px] w-[86px] place-items-center rounded-full border border-amber-300 bg-[#fffaf0] shadow-[0_4px_16px_rgba(169,116,22,0.16)]"><img src={logo} alt="Annai Jewellery" className="h-[78px] w-[78px] object-contain"/></span></Link>
        <nav className="flex min-w-0 flex-1 items-center justify-center gap-3 xl:gap-5">
          {primaryItems.map(([label,href]) => <Link key={href} to={href} className={`border-b-2 py-2 text-xs font-semibold transition xl:text-sm ${location.pathname===href?"border-amber-600 text-amber-700":"border-transparent text-slate-700 hover:border-amber-500 hover:text-amber-700"}`}>{label}</Link>)}
          <div className="group relative"><button className="flex items-center gap-1 border-b-2 border-transparent py-2 text-xs font-semibold text-slate-700 hover:border-amber-500 hover:text-amber-700 xl:text-sm">More <ChevronDown className="h-3.5 w-3.5"/></button><div className="invisible absolute right-0 top-full mt-2 grid w-[430px] grid-cols-2 gap-1 rounded-2xl border border-amber-100 bg-white p-3 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">{allMenuItems.slice(7).map(([label,href])=><Link key={href} to={href} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-amber-50 hover:text-amber-700">{label}</Link>)}</div></div>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={()=>setDrawer("search")} className="grid h-10 w-10 place-items-center rounded-full border border-amber-200 text-slate-800 transition hover:bg-amber-50" aria-label="Search products"><Search className="h-4 w-4"/></button>
          <Link to="/wishlist" className="grid h-10 w-10 place-items-center rounded-full border border-amber-200 text-slate-800 transition hover:bg-amber-50" aria-label="Wishlist"><Heart className="h-4 w-4"/></Link>
          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full border border-amber-200 text-slate-800 transition hover:bg-amber-50" aria-label="Cart"><ShoppingCart className="h-4 w-4"/>{cartItems>0&&<span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-600 px-1 text-[9px] font-bold text-white">{cartItems}</span>}</Link>
          <Link to={accountPath} className="grid h-10 w-10 place-items-center rounded-full bg-amber-600 text-white shadow-md" aria-label={memberName?"My profile":"Login"}><UserRound className="h-4 w-4"/></Link>
        </div>
      </div>

      <div className="relative flex h-[96px] items-center justify-between px-4 lg:hidden">
        <div className="flex items-center gap-1">
          <button onClick={()=>setDrawer("menu")} className="grid h-10 w-10 place-items-center rounded-full text-slate-900" aria-label="Open menu"><Menu className="h-5 w-5"/></button>
          <button onClick={()=>setDrawer("search")} className="grid h-10 w-10 place-items-center rounded-full text-slate-900" aria-label="Search products"><Search className="h-5 w-5"/></button>
        </div>
        <Link to="/" className="absolute left-1/2 flex h-[92px] w-[96px] -translate-x-1/2 items-center justify-center" aria-label="Annai Jewellery home"><span className="grid h-[86px] w-[86px] place-items-center rounded-full border border-amber-300 bg-[#fffaf0] shadow-[0_4px_16px_rgba(169,116,22,0.16)]"><img src={logo} alt="Annai Jewellery" className="h-[78px] w-[78px] object-contain"/></span></Link>
        <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full text-slate-900" aria-label="Cart"><ShoppingBag className="h-5 w-5"/>{cartItems>0&&<span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-amber-600 px-1 text-[8px] font-bold text-white">{cartItems}</span>}</Link>
      </div>
    </header>

    <div className={`fixed inset-0 z-[80] overscroll-none bg-black/35 backdrop-blur-[2px] transition-opacity duration-500 ${drawer?"visible opacity-100":"invisible pointer-events-none opacity-0"}`} onClick={closeDrawer}>
      <aside className={`h-full w-[86%] max-w-sm overflow-hidden overscroll-contain bg-white shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${drawer?"translate-x-0":"-translate-x-full"}`} onClick={(event)=>event.stopPropagation()}>
        <div className="flex h-16 items-center justify-between border-b border-amber-100 px-5"><strong className="text-sm">{drawer==="search"?"Search":"Menu"}</strong><button onClick={closeDrawer} className="grid h-9 w-9 place-items-center rounded-full bg-[#fbf8f1]" aria-label="Close drawer"><X className="h-4 w-4"/></button></div>
        {drawer==="menu"&&<div className="h-[calc(100%-64px)] overflow-y-auto p-4"><nav className="divide-y divide-amber-100">{allMenuItems.map(([label,href])=><Link key={href} to={href} onClick={closeDrawer} className="flex items-center justify-between px-2 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700"><span>{label}</span><ChevronDown className="-rotate-90 h-3.5 w-3.5 text-amber-600"/></Link>)}</nav><Link to="/wishlist" onClick={closeDrawer} className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold"><Heart className="h-4 w-4"/>My Wishlist</Link></div>}
        {drawer==="search"&&<div className="h-[calc(100%-64px)] overflow-y-auto overscroll-contain p-5"><div className="flex items-center rounded-xl border border-amber-200 bg-[#fbf8f1] px-3"><input autoFocus value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search jewellery..." className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"/><Search className="h-4 w-4 text-amber-600"/></div>{query?<div className="mt-5 space-y-2">{searchResults.length?searchResults.map((product)=><Link key={product.name} to={`/product/${productSlug(product.name)}`} onClick={closeDrawer} className="flex items-center gap-3 rounded-xl border border-amber-100 p-2"><img src={product.image} alt="" className="h-12 w-12 rounded-lg object-contain"/><span><strong className="block text-xs">{product.name}</strong><small className="text-[10px] text-slate-500">{product.material}</small></span></Link>):<p className="py-8 text-center text-xs text-slate-500">No products found.</p>}</div>:<div className="mt-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">Trending now</p><div className="mt-3 flex flex-wrap gap-2">{["necklaces","earrings","chain bracelets","kada bracelets","silver jewellery","bridal"].map((term)=><button key={term} onClick={()=>setQuery(term)} className="rounded-full border border-amber-200 px-3 py-1.5 text-[10px] text-slate-600"><Search className="mr-1 inline h-3 w-3"/>{term}</button>)}</div></div>}</div>}
      </aside>
    </div>

    <nav className="mobile-bottom-navigation fixed inset-x-0 bottom-0 z-50 grid h-[62px] grid-cols-5 border-t border-amber-100 bg-white px-2 shadow-[0_-8px_30px_rgba(90,60,10,0.08)] lg:hidden">
      {[
        [Home,"Home","/"],
        [Gem,"Collections","/collection/indian-jewellery"],
        [Heart,"Wishlist","/wishlist"],
        [ShoppingCart,"Cart","/cart"],
        [UserRound,"Profile",accountPath],
      ].map(([Icon,label,href])=><Link key={label as string} to={href as string} className={`relative flex flex-col items-center justify-center gap-1 text-[9px] font-semibold ${location.pathname===href?"text-amber-600":"text-slate-600"}`}><Icon className="h-[18px] w-[18px]"/><span>{label as string}</span>{label==="Cart"&&cartItems>0&&<span className="absolute right-[24%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber-600 px-1 text-[8px] text-white">{cartItems}</span>}</Link>)}
    </nav>
  </>;
};

export default Header;
