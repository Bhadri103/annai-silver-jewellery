import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Eye, Filter, Heart, IndianRupee, Minus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { readCart, writeCart } from "../lib/cart";
import { productShelves, productSlug } from "./HomePage";
import { SEO } from "./highgrade/shared";
import Price from "../components/Price";

export default function CollectionPage() {
  const { collectionId } = useParams();
  const allProducts = productShelves.flatMap((item) => item.products);
  const requestedTitle = (collectionId || "products").split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  const matchedShelf = productShelves.find((item) => item.id === collectionId);
  const collectionKeywords: Record<string, string[]> = {
    bangles: ["bangle", "kada"],
    "kada-bracelets": ["bangle", "bracelet"],
    anklets: ["silver", "chain"],
    "bridal-jewellery": ["bridal", "temple", "heritage", "lakshmi"],
    "antique-jewellery": ["antique", "temple", "heritage"],
    "stone-jewellery": ["zircon", "ruby", "emerald", "stone"],
    "gold-plated-jewellery": ["24k gold plating", "gold-plated"],
    "silver-jewellery": ["silver", "925"],
  };
  const keywords = collectionKeywords[collectionId || ""] || [collectionId?.replace(/s$/, "") || ""];
  const relatedProducts = allProducts.filter((product) => keywords.some((keyword) => `${product.name} ${product.material}`.toLowerCase().includes(keyword)));
  const shelf = matchedShelf || {
    id: collectionId || "products",
    kicker: "Annai Collections",
    title: requestedTitle,
    text: `Explore our curated ${requestedTitle.toLowerCase()} collection.`,
    products: collectionId === "indian-jewellery" ? allProducts : relatedProducts.length ? relatedProducts : allProducts,
  };
  const [sort, setSort] = useState("featured");
  const [material, setMaterial] = useState("All");
  const [availability, setAvailability] = useState("in-stock");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(250000);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [cart, setCart] = useState(() => readCart());
  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [filtersOpen]);
  const materials = ["All", ...Array.from(new Set(shelf.products.map((product) => product.material)))];
  const products = useMemo(() => {
    const filtered = shelf.products.filter((product) => {
      const productPrice = Number(product.price.replace(/[^\d]/g, ""));
      const query = search.trim().toLowerCase();
      return (material === "All" || product.material === material) && availability === "in-stock" && productPrice >= minPrice && productPrice <= maxPrice && (!query || `${product.name} ${product.material}`.toLowerCase().includes(query));
    });
    return [...filtered].sort((a, b) => {
      const price = (value: string) => Number(value.replace(/[^\d]/g, ""));
      if (sort === "low") return price(a.price) - price(b.price);
      if (sort === "high") return price(b.price) - price(a.price);
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [availability, material, maxPrice, minPrice, search, shelf.products, sort]);

  const categoryLinks = [
    ["New Arrivals", "new-arrivals"], ["Necklaces", "necklaces"], ["Earrings", "earrings"], ["Bangles", "bangles"],
    ["Kada Bracelets", "kada-bracelets"], ["Chains", "chains"], ["Chain Bracelets", "chain-bracelets"],
    ["Anklets", "anklets"], ["Watches", "watches"], ["Indian Jewellery", "indian-jewellery"],
  ];
  const getCategoryCount = (id: string) => {
    if (id === "indian-jewellery") return allProducts.length;
    const exactShelf = productShelves.find((item) => item.id === id);
    if (exactShelf) return exactShelf.products.length;
    const categoryTerms: Record<string, string[]> = {
      "kada-bracelets": ["bangle", "bracelet"],
      anklets: ["anklet"],
      watches: ["watch"],
    };
    const terms = categoryTerms[id] || [id.replace(/s$/, "")];
    return allProducts.filter((product) => terms.some((term) => `${product.name} ${product.material}`.toLowerCase().includes(term))).length;
  };

  const FilterPanel = () => <aside className="h-full overflow-y-auto bg-white p-5 sm:p-7">
    <div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><SlidersHorizontal className="h-5 w-5 text-amber-600"/>Filters</h2><button onClick={()=>setFiltersOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-amber-100 text-slate-600 transition hover:rotate-90 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700" aria-label="Close filters"><X className="h-5 w-5"/></button></div>
    <div className="border-t border-amber-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Categories</h3><nav className="mt-3 space-y-1">{categoryLinks.map(([label,id])=><Link key={id} to={`/collection/${id}`} onClick={()=>setFiltersOpen(false)} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${collectionId===id?"bg-amber-50 font-semibold text-amber-700":"text-slate-600 hover:bg-[#fbf8f1] hover:text-amber-700"}`}><span>{label}</span><span className={`min-w-7 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold ${collectionId===id?"bg-white text-amber-700":"bg-[#fbf8f1] text-slate-500"}`}>{getCategoryCount(id)}</span></Link>)}</nav></div>
    <div className="mt-6 border-t border-amber-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Material</h3><div className="mt-3 flex flex-wrap gap-2">{materials.map(item=><button key={item} type="button" onClick={()=>setMaterial(item)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${material===item?"border-amber-600 bg-amber-600 text-white":"border-amber-100 bg-[#fbf8f1] text-slate-600"}`}>{item}</button>)}</div></div>
    <div className="mt-6 border-t border-amber-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Availability</h3><label className="mt-3 flex cursor-pointer items-center justify-between text-sm text-slate-600"><span className="flex items-center gap-2"><input type="radio" checked={availability==="in-stock"} onChange={()=>setAvailability("in-stock")} className="accent-amber-600"/>In stock</span><span>({shelf.products.length})</span></label><label className="mt-3 flex cursor-pointer items-center justify-between text-sm text-slate-400"><span className="flex items-center gap-2"><input type="radio" checked={availability==="out-of-stock"} onChange={()=>setAvailability("out-of-stock")} className="accent-amber-600"/>Out of stock</span><span>(0)</span></label></div>
    <div className="mt-6 border-t border-amber-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Price</h3><div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2"><label className="text-[10px] uppercase tracking-wider text-slate-500">From<div className="mt-1 flex rounded-xl border border-amber-100 bg-[#fbf8f1]"><span className="grid place-items-center px-2 py-2"><IndianRupee className="h-3.5 w-3.5"/></span><input type="number" min="0" max={maxPrice} value={minPrice} onChange={(event)=>setMinPrice(Math.max(0,Number(event.target.value)))} className="min-w-0 w-full bg-transparent py-2 pr-2 text-sm outline-none"/></div></label><span className="pb-2 text-xs text-slate-400">to</span><label className="text-[10px] uppercase tracking-wider text-slate-500">To<div className="mt-1 flex rounded-xl border border-amber-100 bg-[#fbf8f1]"><span className="grid place-items-center px-2 py-2"><IndianRupee className="h-3.5 w-3.5"/></span><input type="number" min={minPrice} value={maxPrice} onChange={(event)=>setMaxPrice(Math.max(minPrice,Number(event.target.value)))} className="min-w-0 w-full bg-transparent py-2 pr-2 text-sm outline-none"/></div></label></div><input type="range" min="0" max="250000" step="5000" value={maxPrice} onChange={(event)=>setMaxPrice(Number(event.target.value))} className="mt-4 w-full accent-amber-600"/><div className="mt-2 flex justify-between text-xs text-slate-500"><Price value={0}/><Price value={250000}/></div></div>
    <div className="mt-6 border-t border-amber-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Sort products</h3><select value={sort} onChange={(event)=>setSort(event.target.value)} className="mt-3 w-full rounded-xl border border-amber-100 bg-[#fbf8f1] px-3 py-3 text-sm outline-none"><option value="featured">Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option><option value="name">Name: A to Z</option></select></div>
    <button onClick={()=>{setMaterial("All");setAvailability("in-stock");setMinPrice(0);setMaxPrice(250000);}} className="mt-6 w-full rounded-full border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-700">Clear filters</button>
  </aside>;

  const changeCartQuantity = (product: typeof shelf.products[number], change: number) => {
    const key = `jewel-${productSlug(product.name)}`;
    const currentCart = readCart();
    const quantity = Math.max(0, Number(currentCart[key] || 0) + change);
    const nextCart = { ...currentCart };
    if (quantity) nextCart[key] = quantity;
    else delete nextCart[key];
    writeCart(nextCart);
    if (quantity) localStorage.setItem("annai_cart_products", JSON.stringify({ ...JSON.parse(localStorage.getItem("annai_cart_products") || "{}"), [key]: product }));
    setCart(nextCart);
    setNotice(quantity ? `${product.name} quantity updated.` : `${product.name} removed from cart.`);
    window.setTimeout(() => setNotice(""), 2500);
  };

  return <>
    <SEO title={`${shelf.title} Collection`} description={shelf.text}/>
    <section className="relative flex min-h-[340px] items-center overflow-hidden bg-[#fbf8f1] px-4 py-14 sm:min-h-[390px] sm:px-6 lg:px-10">
      <img
        src={shelf.products[0]?.image || allProducts[0]?.image}
        alt=""
        aria-hidden="true"
        data-eager="true"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#fbf8f1] via-[#fbf8f1]/95 to-[#fbf8f1]/25 sm:via-[#fbf8f1]/85 sm:to-transparent"/>
      <div className="absolute inset-0 bg-gradient-to-t from-[#fbf8f1]/55 via-transparent to-white/20"/>
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-200/25 blur-3xl"/>
      <div className="relative mx-auto w-full max-w-7xl">
        <nav className="mb-6 flex gap-2 text-xs text-slate-500"><Link to="/">Home</Link><span>/</span><span className="text-amber-700">{shelf.title}</span></nav>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">{shelf.kicker}</p>
        <h1 className="mt-3 text-5xl font-medium text-slate-900 sm:text-6xl">{shelf.title}</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">{shelf.text}</p>
        <div className="mt-7 inline-flex rounded-full border border-amber-200 bg-white/85 px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur">
          {shelf.products.length} designs available
        </div>
      </div>
    </section>

    <section className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="collection-mobile-search sticky top-[92px] z-30 mb-5 flex items-center rounded-2xl border border-amber-200 bg-white/95 p-1.5 shadow-[0_12px_35px_rgba(143,101,31,0.1)] backdrop-blur-xl lg:hidden">
          <button type="button" onClick={()=>setFiltersOpen(true)} className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-600 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95" aria-label="Open filters"><SlidersHorizontal className="h-5 w-5"/>{(material!=="All"||minPrice>0||maxPrice<250000||availability!=="in-stock")&&<span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-[#D4AF37]"/>}</button>
          <Search className="ml-3 h-5 w-5 shrink-0 text-amber-600"/>
          <input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder={`Search ${shelf.title.toLowerCase()}...`} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" aria-label={`Search ${shelf.title}`}/>
          {search&&<button type="button" onClick={()=>setSearch("")} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400" aria-label="Clear search"><X className="h-4 w-4"/></button>}
        </div>
        <div className="sticky top-[92px] z-30 mb-7 hidden flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-100 bg-white/95 p-4 shadow-sm backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3">
            <button type="button" onClick={()=>setFiltersOpen(true)} className="relative inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-lg active:scale-95" aria-label="Open filters"><SlidersHorizontal className="h-4 w-4"/>Filters{(material!=="All"||minPrice>0||maxPrice<250000||availability!=="in-stock")&&<span className="h-2 w-2 rounded-full bg-white"/>}</button>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Filter className="h-4 w-4 text-amber-600"/>{products.length} products</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-500">Material
              <select value={material} onChange={(event)=>setMaterial(event.target.value)} className="rounded-xl border border-amber-100 bg-[#fbf8f1] px-3 py-2 text-sm text-slate-900 outline-none">{materials.map(item=><option key={item}>{item}</option>)}</select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-500"><SlidersHorizontal className="h-4 w-4"/>Sort
              <select value={sort} onChange={(event)=>setSort(event.target.value)} className="rounded-xl border border-amber-100 bg-[#fbf8f1] px-3 py-2 text-sm text-slate-900 outline-none"><option value="featured">Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option><option value="name">Name</option></select>
            </label>
          </div>
        </div>

        {notice&&<div className="fixed right-4 top-24 z-50 rounded-2xl bg-green-700 px-5 py-3 text-sm text-white shadow-xl">{notice}</div>}
        <div>
          <div className={products.length ? "grid grid-cols-2 items-start gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4" : "min-w-0"}>
          {products.map((product)=>(
            <article key={product.name} className="group self-start overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-44 overflow-hidden bg-[#fbf8f1] sm:h-60 lg:h-64">
                <Link to={`/product/${productSlug(product.name)}`} className="m-2 block h-[calc(100%-1rem)] overflow-hidden rounded-xl"><img src={product.image} alt={product.name} className="h-full w-full rounded-xl object-contain transition duration-700 group-hover:scale-110"/></Link>
                {product.badge&&<span className="absolute left-3 top-3 rounded-full bg-[#D4AF37] px-3 py-1 text-[8px] font-bold uppercase tracking-wider text-white">{product.badge}</span>}
                <div className="absolute right-3 top-3 flex flex-col gap-2"><button className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-amber-700 shadow" aria-label={`Save ${product.name}`}><Heart className="h-4 w-4"/></button><Link to={`/product/${productSlug(product.name)}`} className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-amber-700 shadow" aria-label={`View ${product.name}`}><Eye className="h-4 w-4"/></Link></div>
              </div>
              <div className="p-3 sm:p-5"><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-600">{product.material}</p><h2 className="mt-2 text-sm font-medium text-slate-900 sm:text-lg">{product.name}</h2><div className="mt-4 flex items-center justify-between gap-2"><strong className="text-xs text-slate-900 sm:text-sm"><Price value={product.price}/></strong>{cart[`jewel-${productSlug(product.name)}`] ? <div className="flex h-9 items-center overflow-hidden rounded-full bg-amber-600 text-white shadow-sm"><button type="button" onClick={()=>changeCartQuantity(product,-1)} className="grid h-9 w-8 place-items-center hover:bg-amber-700" aria-label={`Remove one ${product.name}`}><Minus className="h-3.5 w-3.5"/></button><span className="min-w-6 text-center text-xs font-semibold">{cart[`jewel-${productSlug(product.name)}`]}</span><button type="button" onClick={()=>changeCartQuantity(product,1)} className="grid h-9 w-8 place-items-center hover:bg-amber-700" aria-label={`Add one more ${product.name}`}><Plus className="h-3.5 w-3.5"/></button></div> : <button type="button" onClick={()=>changeCartQuantity(product,1)} className="inline-flex h-9 items-center gap-1 rounded-full bg-amber-600 px-3 text-xs font-semibold text-white hover:bg-amber-700" aria-label={`Add ${product.name} to cart`}><Plus className="h-3.5 w-3.5"/>Add</button>}</div><Link to={`/product/${productSlug(product.name)}`} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-700">View details <ArrowRight className="h-3.5 w-3.5"/></Link></div>
            </article>
          ))}
          {!products.length&&<div className="flex min-h-[320px] w-full items-center justify-center rounded-3xl border border-amber-100 bg-[#fbf8f1] p-8 text-center text-slate-500 sm:p-12">No products match the selected filters.</div>}
          </div>
        </div>
      </div>
    </section>
    <div
      aria-hidden={!filtersOpen}
      className={`fixed inset-0 z-[90] flex justify-start bg-slate-950/40 backdrop-blur-[2px] transition-all duration-500 ease-out ${filtersOpen ? "visible opacity-100" : "invisible pointer-events-none opacity-0"}`}
      onClick={()=>setFiltersOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Product filters"
        className={`collection-filter-drawer h-full w-[88%] max-w-md shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${filtersOpen ? "translate-x-0" : "-translate-x-full"}`}
        onClick={(event)=>event.stopPropagation()}
      >
        <FilterPanel/>
      </div>
    </div>
  </>;
}
