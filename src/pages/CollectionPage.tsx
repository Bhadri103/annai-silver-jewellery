import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Eye, Filter, Heart, IndianRupee, Loader2, Minus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { readCart, writeCart } from "../lib/cart";
import { Product, productShelves, productSlug } from "./HomePage";
import { SEO } from "../components/JewelleryUI";
import Price from "../components/Price";
import { websiteApi, WebsiteCategory } from "../lib/api";
import { loadWishlistIds, notifyWishlistUpdated, wishlistUpdatedEvent } from "../lib/wishlist";

export default function CollectionPage() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [liveCategories, setLiveCategories] = useState<WebsiteCategory[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const requestingRef = useRef(false);
  const isAllProducts = collectionId === "products" || collectionId === "indian-jewellery";
  const bundledProducts = [...new Map(productShelves.flatMap((item) => item.products).map((product) => [productSlug(product.name), product])).values()];
  const allProducts = productsLoaded ? liveProducts : bundledProducts;
  const requestedTitle = (collectionId || "products").split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  const liveCategoryProducts = liveProducts.filter((product) => product.category && product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") === collectionId);
  const matchedShelf = productsLoaded ? {
    id: collectionId || "products",
    kicker: "",
    title: isAllProducts ? "Products" : liveCategoryProducts[0]?.category || liveCategories.find((category) => category.slug === collectionId)?.name || requestedTitle,
    text: "",
    products: liveProducts,
  } : productShelves.find((item) => item.id === collectionId);
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
    text: "",
    products: isAllProducts ? allProducts : relatedProducts.length ? relatedProducts : allProducts,
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
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const selectedCategoryName = liveCategories.find((category) => category.slug === collectionId)?.name || "";
  const categoryRequestReady = isAllProducts || categoriesLoaded;
  useEffect(() => {
    let active = true;
    websiteApi.categories()
      .then((result) => { if (active) setLiveCategories(result.categories); })
      .catch(() => undefined)
      .finally(() => { if (active) setCategoriesLoaded(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    const syncWishlist = () => {
      loadWishlistIds()
        .then((ids) => { if (active) setWishlistIds(ids); })
        .catch(() => { if (active) setWishlistIds(new Set()); });
    };
    syncWishlist();
    window.addEventListener(wishlistUpdatedEvent, syncWishlist);
    return () => {
      active = false;
      window.removeEventListener(wishlistUpdatedEvent, syncWishlist);
    };
  }, []);
  useEffect(() => {
    if (!categoryRequestReady) return;
    let active = true;
    requestingRef.current = true;
    setLoadingProducts(true);
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ page: String(page), limit: "10", sort });
      if (selectedCategoryName) params.set("category", selectedCategoryName);
      if (collectionId === "best-sellers" || collectionId === "new-arrivals") {
        params.set("collection", collectionId);
      } else if (!isAllProducts && categoryRequestReady && !selectedCategoryName) {
        params.set("search", collectionId?.replace(/-/g, " ") || "");
      }
      if (search.trim()) params.set("search", search.trim());
      params.set("inStock", availability === "in-stock" ? "true" : "false");
      if (minPrice > 0) params.set("minPrice", String(minPrice));
      if (maxPrice < 250000) params.set("maxPrice", String(maxPrice));
      if (material !== "All") params.set("material", material);
      websiteApi.products(params.toString()).then((productResult) => {
        if (!active) return;
        const nextProducts = productResult.products.map((item) => ({
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
        }));
        setLiveProducts((current) => {
          if (page === 1) return nextProducts;
          return [...new Map([...current, ...nextProducts].map((product) => [String(product.id || productSlug(product.name)), product])).values()];
        });
        setProductsLoaded(true);
        setTotal(productResult.total);
        setTotalPages(productResult.totalPages);
      }).catch(() => {
        if (active && page > 1) setTotalPages(page);
      }).finally(() => {
        if (active) setLoadingProducts(false);
        requestingRef.current = false;
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
      requestingRef.current = false;
    };
  }, [availability, categoryRequestReady, collectionId, isAllProducts, material, maxPrice, minPrice, page, search, selectedCategoryName, sort]);
  useEffect(() => {
    setPage(1);
    setTotal(0);
    setTotalPages(1);
    setLiveProducts([]);
    setProductsLoaded(false);
  }, [availability, collectionId, material, maxPrice, minPrice, search, sort]);
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !productsLoaded || loadingProducts || page >= totalPages) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || requestingRef.current) return;
      requestingRef.current = true;
      setPage((current) => Math.min(current + 1, totalPages));
    }, { rootMargin: "0px", threshold: 0.1 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadingProducts, page, productsLoaded, totalPages]);
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
      const isAvailable = product.inStock !== false && (product.stock === undefined || Number(product.stock) > 0);
      const matchesAvailability = availability === "in-stock" ? isAvailable : !isAvailable;
      return (material === "All" || product.material === material) && matchesAvailability && productPrice >= minPrice && productPrice <= maxPrice && (!query || `${product.name} ${product.material}`.toLowerCase().includes(query));
    });
    return [...filtered].sort((a, b) => {
      const price = (value: string) => Number(value.replace(/[^\d]/g, ""));
      if (sort === "low") return price(a.price) - price(b.price);
      if (sort === "high") return price(b.price) - price(a.price);
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [availability, material, maxPrice, minPrice, search, shelf.products, sort]);

  const defaultCategoryLinks = [
    ["Bangles", "bangles"], ["Chains", "chains"], ["Earrings", "earrings"],
    ["Jewellery", "jewellery"], ["Necklaces", "necklaces"],
  ];
  const categoryLinks = liveCategories.length
    ? liveCategories.filter((category) => category.productCount > 0).map((category) => [category.name, category.slug])
    : defaultCategoryLinks;
  const getCategoryCount = (id: string) => {
    if (liveCategories.length) {
      if (id === "indian-jewellery") return liveCategories.reduce((sum, category) => sum + Number(category.productCount || 0), 0);
      return Number(liveCategories.find((category) => category.slug === id)?.productCount || 0);
    }
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
    <div className="mt-6 border-t border-amber-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Availability</h3><label className="mt-3 flex cursor-pointer items-center justify-between text-sm text-slate-600"><span className="flex items-center gap-2"><input type="radio" checked={availability==="in-stock"} onChange={()=>setAvailability("in-stock")} className="accent-amber-600"/>In stock</span><span>({shelf.products.filter((product) => product.inStock !== false && (product.stock === undefined || Number(product.stock) > 0)).length})</span></label><label className="mt-3 flex cursor-pointer items-center justify-between text-sm text-slate-600"><span className="flex items-center gap-2"><input type="radio" checked={availability==="out-of-stock"} onChange={()=>setAvailability("out-of-stock")} className="accent-amber-600"/>Out of stock</span><span>({shelf.products.filter((product) => product.inStock === false || (product.stock !== undefined && Number(product.stock) <= 0)).length})</span></label></div>
    <div className="mt-6 border-t border-amber-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Price</h3><div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2"><label className="text-[10px] uppercase tracking-wider text-slate-500">From<div className="mt-1 flex rounded-xl border border-amber-100 bg-[#fbf8f1]"><span className="grid place-items-center px-2 py-2"><IndianRupee className="h-3.5 w-3.5"/></span><input type="number" min="0" max={maxPrice} value={minPrice} onChange={(event)=>setMinPrice(Math.max(0,Number(event.target.value)))} className="min-w-0 w-full bg-transparent py-2 pr-2 text-sm outline-none"/></div></label><span className="pb-2 text-xs text-slate-400">to</span><label className="text-[10px] uppercase tracking-wider text-slate-500">To<div className="mt-1 flex rounded-xl border border-amber-100 bg-[#fbf8f1]"><span className="grid place-items-center px-2 py-2"><IndianRupee className="h-3.5 w-3.5"/></span><input type="number" min={minPrice} value={maxPrice} onChange={(event)=>setMaxPrice(Math.max(minPrice,Number(event.target.value)))} className="min-w-0 w-full bg-transparent py-2 pr-2 text-sm outline-none"/></div></label></div><input type="range" min="0" max="250000" step="5000" value={maxPrice} onChange={(event)=>setMaxPrice(Number(event.target.value))} className="mt-4 w-full accent-amber-600"/><div className="mt-2 flex justify-between text-xs text-slate-500"><Price value={0}/><Price value={250000}/></div></div>
    <div className="mt-6 border-t border-amber-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Sort products</h3><select value={sort} onChange={(event)=>setSort(event.target.value)} className="mt-3 w-full rounded-xl border border-amber-100 bg-[#fbf8f1] px-3 py-3 text-sm outline-none"><option value="featured">Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option><option value="name">Name: A to Z</option></select></div>
    <button onClick={()=>{setMaterial("All");setAvailability("in-stock");setMinPrice(0);setMaxPrice(250000);}} className="mt-6 w-full rounded-full border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-700">Clear filters</button>
  </aside>;

  const toggleWishlist = async (product: Product) => {
    if (!product.id) {
      setNotice("This product is still loading. Please try again.");
      window.setTimeout(() => setNotice(""), 2500);
      return;
    }
    const productId = String(product.id);
    try {
      if (wishlistIds.has(productId)) {
        await websiteApi.removeWishlist(product.id);
        setWishlistIds((current) => {
          const next = new Set(current);
          next.delete(productId);
          return next;
        });
        setNotice(`${product.name} removed from your wishlist.`);
      } else {
        await websiteApi.addWishlist(product.id);
        setWishlistIds((current) => new Set(current).add(productId));
        setNotice(`${product.name} added to your wishlist.`);
      }
      notifyWishlistUpdated();
    } catch (error) {
      setNotice(error instanceof Error && /login|required|session/i.test(error.message) ? "Please sign in to use your wishlist." : (error as Error).message);
    }
    window.setTimeout(() => setNotice(""), 2500);
  };

  const changeCartQuantity = (product: typeof shelf.products[number], change: number) => {
    const key = `jewel-${productSlug(product.name)}`;
    const currentCart = readCart();
    const requestedQuantity = Math.max(0, Number(currentCart[key] || 0) + change);
    const quantity = product.stock === undefined ? requestedQuantity : Math.min(requestedQuantity, Math.max(product.stock, 0));
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
    <section className="border-b border-amber-100 bg-white px-4 py-6 text-center sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="storefront-page-title !mt-0">{shelf.title}</h1>
        <p className="storefront-page-copy mx-auto max-w-xl">{shelf.text || `Explore our ${shelf.title.toLowerCase()} collection.`}</p>
      </div>
    </section>

    <section className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="collection-mobile-search sticky top-[92px] z-30 mb-5 flex items-center rounded-2xl border border-amber-200 bg-white/95 p-1.5 shadow-[0_12px_35px_rgba(143,101,31,0.1)] backdrop-blur-xl lg:hidden">
          <button type="button" onClick={()=>setFiltersOpen(true)} className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-600 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95" aria-label="Open filters"><SlidersHorizontal className="h-5 w-5"/>{(material!=="All"||minPrice>0||maxPrice<250000||availability!=="in-stock")&&<span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-[#D4AF37]"/>}</button>
          <Search className="ml-3 h-5 w-5 shrink-0 text-amber-600"/>
          <input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder={`Search ${shelf.title.toLowerCase()}...`} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" aria-label={`Search ${shelf.title}`}/>
          {search&&<button type="button" onClick={()=>setSearch("")} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400" aria-label="Clear search"><X className="h-4 w-4"/></button>}
        </div>
        <div className="sticky top-[92px] z-30 mb-7 hidden items-center gap-4 rounded-2xl border border-amber-100 bg-white/95 p-4 shadow-sm backdrop-blur-xl lg:flex">
          <div className="flex shrink-0 items-center gap-3">
            <button type="button" onClick={()=>setFiltersOpen(true)} className="relative inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-lg active:scale-95" aria-label="Open filters"><SlidersHorizontal className="h-4 w-4"/>Filters{(material!=="All"||minPrice>0||maxPrice<250000||availability!=="in-stock")&&<span className="h-2 w-2 rounded-full bg-white"/>}</button>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Filter className="h-4 w-4 text-amber-600"/>{total || products.length} products</div>
          </div>
          <label className="flex min-w-52 flex-1 items-center rounded-xl border border-amber-100 bg-[#fbf8f1] px-3 transition focus-within:border-amber-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]">
            <Search className="h-4 w-4 shrink-0 text-amber-600"/>
            <input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder={`Search ${shelf.title.toLowerCase()}...`} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" aria-label={`Search ${shelf.title}`}/>
            {search&&<button type="button" onClick={()=>setSearch("")} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-700" aria-label="Clear search"><X className="h-4 w-4"/></button>}
          </label>
          <div className="flex shrink-0 items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-500">Material
              <select value={material} onChange={(event)=>setMaterial(event.target.value)} className="rounded-xl border border-amber-100 bg-[#fbf8f1] px-3 py-2 text-sm text-slate-900 outline-none">{materials.map(item=><option key={item}>{item}</option>)}</select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-500"><SlidersHorizontal className="h-4 w-4"/>Sort
              <select value={sort} onChange={(event)=>setSort(event.target.value)} className="rounded-xl border border-amber-100 bg-[#fbf8f1] px-3 py-2 text-sm text-slate-900 outline-none"><option value="featured">Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option><option value="name">Name</option></select>
            </label>
          </div>
        </div>

        {notice&&<div className="fixed right-4 top-24 z-50 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-100 via-green-100 to-lime-100 px-5 py-3 text-sm font-medium text-emerald-900 shadow-[0_12px_30px_rgba(34,197,94,0.18)]">{notice}</div>}
        <div className="relative">
          {loadingProducts&&page===1&&<div className="absolute inset-0 z-20 grid min-h-80 place-items-center rounded-3xl bg-white/75 backdrop-blur-sm"><div className="flex items-center gap-3 rounded-full border border-amber-100 bg-white px-5 py-3 text-sm font-semibold text-amber-700 shadow-lg"><Loader2 className="h-4 w-4 animate-spin"/>Loading jewellery</div></div>}
          <div className={products.length ? "grid grid-cols-2 items-start gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4" : "min-w-0"}>
          {products.map((product)=>(
            <article key={product.name} role="link" tabIndex={0} aria-label={`View ${product.name}`} onClick={(event)=>{if(!(event.target as HTMLElement).closest("button,a"))navigate(`/product/${productSlug(product.name)}`);}} onKeyDown={(event)=>{if(event.key==="Enter")navigate(`/product/${productSlug(product.name)}`);}} className="group cursor-pointer self-start overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-44 overflow-hidden bg-[#fbf8f1] sm:h-60 lg:h-64">
                <Link to={`/product/${productSlug(product.name)}`} className="m-2 block h-[calc(100%-1rem)] overflow-hidden rounded-xl"><img src={product.image} alt={product.name} className="h-full w-full rounded-xl object-contain transition duration-700 group-hover:scale-110"/></Link>
                {product.badge&&<span className="absolute left-3 top-3 rounded-full bg-[#D4AF37] px-3 py-1 text-[8px] font-bold uppercase tracking-wider text-white">{product.badge}</span>}
                <button type="button" onClick={()=>toggleWishlist(product)} className={`absolute right-14 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow transition hover:scale-105 ${product.id && wishlistIds.has(String(product.id)) ? "text-red-500" : "text-amber-700"}`} aria-label={`${product.id && wishlistIds.has(String(product.id)) ? "Remove" : "Add"} ${product.name} ${product.id && wishlistIds.has(String(product.id)) ? "from" : "to"} wishlist`} title={product.id && wishlistIds.has(String(product.id)) ? "Remove from wishlist" : "Add to wishlist"}><Heart className={`h-4 w-4 ${product.id && wishlistIds.has(String(product.id)) ? "fill-current" : ""}`}/></button>
                <Link to={`/product/${productSlug(product.name)}`} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-amber-700 shadow" aria-label={`View ${product.name}`}><Eye className="h-4 w-4"/></Link>
              </div>
              <div className="p-3 sm:p-5">
                {/* <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-600">{product.material}</p> */}
                <h2 className="mt-2 text-sm font-medium text-slate-900 sm:text-lg">{product.name}</h2><div className="mt-4 flex items-center justify-between gap-2"><strong className="text-xs text-slate-900 sm:text-sm"><Price value={product.price}/></strong>{cart[`jewel-${productSlug(product.name)}`] ? <div className="flex h-9 items-center overflow-hidden rounded-full bg-amber-600 text-white shadow-sm"><button type="button" onClick={()=>changeCartQuantity(product,-1)} className="grid h-9 w-8 place-items-center hover:bg-amber-700" aria-label={`Remove one ${product.name}`}><Minus className="h-3.5 w-3.5"/></button><span className="min-w-6 text-center text-xs font-semibold">{cart[`jewel-${productSlug(product.name)}`]}</span><button type="button" onClick={()=>changeCartQuantity(product,1)} className="grid h-9 w-8 place-items-center hover:bg-amber-700" aria-label={`Add one more ${product.name}`}><Plus className="h-3.5 w-3.5"/></button></div> : <button type="button" onClick={()=>changeCartQuantity(product,1)} className="inline-flex h-9 items-center gap-1 rounded-full bg-amber-600 px-3 text-xs font-semibold text-white hover:bg-amber-700" aria-label={`Add ${product.name} to cart`}><Plus className="h-3.5 w-3.5"/>Add</button>}</div><Link to={`/product/${productSlug(product.name)}`} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-700">View details <ArrowRight className="h-3.5 w-3.5"/></Link></div>
            </article>
          ))}
          {!products.length&&<div className="flex min-h-[320px] w-full items-center justify-center rounded-3xl border border-amber-100 bg-[#fbf8f1] p-8 text-center text-slate-500 sm:p-12">No products match the selected filters.</div>}
          </div>
          <div ref={loadMoreRef} className="flex min-h-16 items-center justify-center" aria-live="polite">
            {loadingProducts&&page>1&&<span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700"><Loader2 className="h-4 w-4 animate-spin"/>Loading </span>}
            {!loadingProducts&&productsLoaded&&products.length>0&&page>=totalPages&&<span className="text-xs text-slate-400"></span>}
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
