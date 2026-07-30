import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock, Heart, Minus, Plus, Share2, Star, Truck, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { readCart, writeCart } from "../lib/cart";
import { productShelves, productSlug } from "./HomePage";
import { SEO } from "../components/JewelleryUI";
import ZoomableProductImage from "../components/ZoomableProductImage";
import Price from "../components/Price";
import { usePopupTransition } from "../lib/usePopupTransition";
import { websiteApi, WebsiteProduct, WebsiteTestimonial } from "../lib/api";
import { loadWishlistIds, notifyWishlistUpdated, wishlistUpdatedEvent } from "../lib/wishlist";

const toStoreProduct = (item: WebsiteProduct) => ({
  id: item.id,
  name: item.name,
  material: item.material || "925 Silver with 24K Gold Plating",
  price: String(item.price),
  image: item.image || item.imageUrl || "",
  images: item.images?.length ? item.images : [item.image || item.imageUrl || ""],
  badge: item.badge,
  description: item.description,
  category: item.category,
  rating: item.rating,
  reviewCount: item.reviewCount,
  relatedProductIds: item.relatedProductIds || [],
  stock: item.stock,
  inStock: item.inStock,
});

export default function ProductDetailPage() {
  const { slug } = useParams();
  const staticProducts = productShelves.flatMap((shelf) => shelf.products);
  const [catalogue, setCatalogue] = useState<typeof staticProducts>([]);
  const [catalogueLoaded, setCatalogueLoaded] = useState(false);
  const products = catalogue.length ? catalogue : staticProducts;
  const resolvedProduct = products.find((item) => productSlug(item.name) === slug);
  const product = resolvedProduct || {
    name: "",
    material: "",
    price: "0",
    image: "",
    images: [""],
    relatedProductIds: [],
  };
  const gallery = product.images?.filter(Boolean).length ? product.images.filter(Boolean) : [product.image];
  const related = product.relatedProductIds?.length
    ? products.filter((item) => item.id && product.relatedProductIds?.includes(String(item.id))).slice(0, 6)
    : products.filter((item) => item.name !== product.name && (!product.category || item.category === product.category)).slice(0, 6);
  const [imageIndex, setImageIndex] = useState(0);
  const [cart, setCart] = useState(() => readCart());
  const [tab, setTab] = useState("Description");
  const [notice, setNotice] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const imageModal = usePopupTransition(imageModalOpen);
  const [recentlyViewed, setRecentlyViewed] = useState<typeof products>([]);
  const [productReviews, setProductReviews] = useState<WebsiteTestimonial[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, text: "" });
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const productKey = `jewel-${productSlug(product.name)}`;
  const changeImage = (direction: number) => {
    setImageIndex((current) => (current + direction + gallery.length) % gallery.length);
  };

  useEffect(() => {
    let active = true;
    websiteApi.products().then(({ products: rows }) => {
      if (active && rows.length) setCatalogue(rows.map(toStoreProduct));
    }).catch(() => { /* retain bundled catalogue when the API is unavailable */ })
      .finally(() => { if (active) setCatalogueLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!product.id) {
      setIsWishlisted(false);
      return;
    }
    let active = true;
    const syncWishlist = () => {
      loadWishlistIds()
        .then((ids) => { if (active) setIsWishlisted(ids.has(String(product.id))); })
        .catch(() => { if (active) setIsWishlisted(false); });
    };
    syncWishlist();
    window.addEventListener(wishlistUpdatedEvent, syncWishlist);
    return () => {
      active = false;
      window.removeEventListener(wishlistUpdatedEvent, syncWishlist);
    };
  }, [product.id]);

  useEffect(() => {
    if (!product.id) return;
    websiteApi.testimonials(`page=${reviewPage}&limit=5&productId=${encodeURIComponent(product.id)}`)
      .then(({ testimonials, totalPages, total }) => {
        setProductReviews(testimonials);
        setReviewTotalPages(Math.max(1, totalPages || 1));
        setReviewTotal(Number(total || 0));
      })
      .catch(() => {
        setProductReviews([]);
        setReviewTotalPages(1);
        setReviewTotal(0);
      });
  }, [product.id, reviewPage, reviewRefresh]);

  useEffect(() => {
    if (!imageModal.mounted) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImageModalOpen(false);
      if (event.key === "ArrowLeft" && gallery.length > 1) setImageIndex((current) => (current - 1 + gallery.length) % gallery.length);
      if (event.key === "ArrowRight" && gallery.length > 1) setImageIndex((current) => (current + 1) % gallery.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [gallery.length, imageModal.mounted]);

  useEffect(() => {
    setImageIndex(0);
    setReviewPage(1);
  }, [slug]);

  useEffect(() => {
    const storageKey = "annai_recently_viewed";
    let stored: string[] = [];
    try {
      stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      stored = [];
    }
    if (!resolvedProduct) return;
    setRecentlyViewed(stored.filter((item) => item !== productSlug(product.name)).map((item) => products.find((candidate) => productSlug(candidate.name) === item)).filter((item): item is typeof products[number] => Boolean(item)).slice(0, 6));
    localStorage.setItem(storageKey, JSON.stringify([productSlug(product.name), ...stored.filter((item) => item !== productSlug(product.name))].slice(0, 12)));
  // Catalogue changes are reflected through the product slug.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.name, resolvedProduct]);

  const toggleWishlist = async () => {
    if (!product.id) {
      setNotice("Please sign in to save this product.");
      return;
    }
    try {
      if (isWishlisted) {
        await websiteApi.removeWishlist(product.id);
        setIsWishlisted(false);
        setNotice("Removed from your wishlist.");
        notifyWishlistUpdated();
      } else {
        await websiteApi.addWishlist(product.id);
        setIsWishlisted(true);
        setNotice("Added to your wishlist.");
        notifyWishlistUpdated();
      }
    } catch (error) {
      setNotice(error instanceof Error && /login|required|session/i.test(error.message) ? "Please sign in to use your wishlist." : (error as Error).message);
    }
  };

  const submitProductReview = async (event: React.FormEvent) => {
    event.preventDefault();
    setReviewMessage("");
    const next: Record<string, string> = {};
    if (!reviewForm.name.trim()) next.name = "Enter your name.";
    if (!reviewForm.text.trim()) next.text = "Enter your review.";
    if (Object.keys(next).length) return setReviewErrors(next);
    setReviewErrors({});
    try {
      const result = await websiteApi.createTestimonial({ ...reviewForm, productId: product.id });
      setReviewForm({ name: "", rating: 5, text: "" });
      setReviewFormOpen(false);
      setReviewPage(1);
      setReviewRefresh((current) => current + 1);
      setReviewMessage(("message" in result && String(result.message)) || "Your review is now published.");
    } catch (error) { setReviewMessage(error instanceof Error ? error.message : "Unable to submit your review."); }
  };

  const changeCartQuantity = (change: number) => {
    const currentCart = readCart();
    const requestedQuantity = Math.max(0, Number(currentCart[productKey] || 0) + change);
    const quantity = product.stock === undefined ? requestedQuantity : Math.min(requestedQuantity, Math.max(product.stock, 0));
    const nextCart = { ...currentCart };
    if (quantity) nextCart[productKey] = quantity;
    else delete nextCart[productKey];
    writeCart(nextCart);
    if (quantity) localStorage.setItem("annai_cart_products", JSON.stringify({ ...JSON.parse(localStorage.getItem("annai_cart_products") || "{}"), [productKey]: product }));
    setCart(nextCart);
    setNotice(quantity ? "Cart quantity updated." : "Product removed from cart.");
  };

  if (!resolvedProduct) {
    return <section className="grid min-h-[50vh] place-items-center px-4 text-center">
      <div>
        <h1 className="storefront-page-title !mt-0">{catalogueLoaded ? "Product not found" : "Loading product..."}</h1>
        {catalogueLoaded && <Link to="/collection/products" className="mt-4 inline-flex rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white">View all jewellery</Link>}
      </div>
    </section>;
  }

  return <>
    <SEO title={product.name} description={`Shop ${product.name} from Annai Jewellery. Premium ${product.material}, certified quality and insured delivery.`} />
    <section className="px-4 pb-10 pt-5 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-7 flex flex-wrap gap-2 text-xs text-slate-500"><Link to="/">Home</Link><span>/</span><Link to="/collection/products">Products</Link><span>/</span><span className="text-amber-700">{product.name}</span></nav>
        <div className="grid gap-9 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="relative">
              <ZoomableProductImage src={gallery[imageIndex]} alt={product.name} onOpen={() => setImageModalOpen(true)} className="h-[430px] rounded-[2rem] bg-[#fbf8f1] sm:h-[500px]" />
              <div className="absolute right-4 top-4 z-20 flex gap-2">
                <button type="button" onClick={toggleWishlist} className={`grid h-11 w-11 place-items-center rounded-full border bg-white/95 shadow-lg backdrop-blur transition hover:scale-105 ${isWishlisted ? "border-red-200 text-red-500" : "border-amber-200 text-amber-700 hover:bg-amber-600 hover:text-white"}`} aria-label={`${isWishlisted ? "Remove" : "Add"} ${product.name} ${isWishlisted ? "from" : "to"} wishlist`} title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}><Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} /></button>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(window.location.href); setNotice("Product link copied."); }} className="grid h-11 w-11 place-items-center rounded-full border border-amber-200 bg-white/95 text-amber-700 shadow-lg backdrop-blur transition hover:bg-amber-600 hover:text-white" aria-label={`Share ${product.name}`} title="Share product"><Share2 className="h-5 w-5" /></button>
              </div>
              {gallery.length > 1 && <><button type="button" onClick={() => changeImage(-1)} className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-amber-200 bg-white/95 text-amber-800 shadow-lg transition hover:scale-105 hover:bg-amber-600 hover:text-white sm:left-5 sm:h-11 sm:w-11" aria-label="Previous product image"><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => changeImage(1)} className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-amber-200 bg-white/95 text-amber-800 shadow-lg transition hover:scale-105 hover:bg-amber-600 hover:text-white sm:right-5 sm:h-11 sm:w-11" aria-label="Next product image"><ChevronRight className="h-5 w-5" /></button><span className="absolute bottom-4 right-4 z-20 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{imageIndex + 1} / {gallery.length}</span></>}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">{gallery.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setImageIndex(index)} className={`h-24 overflow-hidden rounded-xl border-2 bg-[#fbf8f1] sm:h-32 ${imageIndex === index ? "border-amber-500" : "border-transparent"}`}><img src={image} alt={`${product.name} gallery ${index + 1}`} className="h-full w-full object-contain object-center" /></button>)}</div>
          </div>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="inline-flex rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{product.badge || "New"}</span>
            <h1 className="storefront-page-title !mt-4">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3"><div className="flex text-amber-500">{[0, 1, 2, 3, 4].map(star => <Star key={star} className="h-4 w-4 fill-current" />)}</div><span className="text-sm text-slate-500">{reviewTotal || product.reviewCount || 0} reviews</span></div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-3xl font-semibold text-slate-900"><Price value={product.price} /></p>{product.inStock === false || product.stock === 0 ? <span className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500">Out of stock</span> : cart[productKey] ? <div className="flex h-11 items-center overflow-hidden rounded-full bg-amber-600 text-white shadow-sm"><button type="button" onClick={() => changeCartQuantity(-1)} className="grid h-11 w-11 place-items-center hover:bg-amber-700" aria-label={`Remove one ${product.name}`}><Minus className="h-4 w-4" /></button><span className="min-w-8 text-center font-semibold">{cart[productKey]}</span><button type="button" onClick={() => changeCartQuantity(1)} className="grid h-11 w-11 place-items-center hover:bg-amber-700" aria-label={`Add one more ${product.name}`}><Plus className="h-4 w-4" /></button></div> : <button type="button" onClick={() => changeCartQuantity(1)} className="inline-flex h-11 items-center gap-2 rounded-full bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"><Plus className="h-4 w-4" />Add</button>}</div>
            <p className="mt-1 text-xs text-slate-500">
              Premium Quality Assured
            </p>

            <div className="mt-6">
              <p className="text-sm font-semibold">
                Finish: <span className="text-slate-500">24K Gold Plated</span>
              </p>
            </div>

            {notice && (
              <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                <Check className="mr-2 inline h-4 w-4" />
                {notice}
              </p>
            )}

          <div className="mt-2 space-y-3 border-y border-amber-100 py-5 text-sm text-slate-600">
  <p className="flex items-center gap-3">
    <Clock className="h-4 w-4 shrink-0 text-amber-600" />
    <span>Carefully packed before dispatch.</span>
  </p>

  <p className="flex items-center gap-3">
    <Truck className="h-4 w-4 shrink-0 text-amber-600" />
    <span>Free delivery within 5 km.</span>
  </p>

  <p className="flex items-center gap-3">
    <Check className="h-4 w-4 shrink-0 text-amber-600" />
    <span>Premium quality craftsmanship.</span>
  </p>

  <p className="flex items-center gap-3">
    <Check className="h-4 w-4 shrink-0 text-amber-600" />
    <span>Elegant gift-ready packaging.</span>
  </p>

  <p className="flex items-center gap-3">
    <Check className="h-4 w-4 shrink-0 text-amber-600" />
    <span>Perfect for weddings & special occasions.</span>
  </p>

  <p className="flex items-center gap-3">
    <Check className="h-4 w-4 shrink-0 text-amber-600" />
    <span>Comfortable for everyday wear.</span>
  </p>

    
</div>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex gap-6 overflow-x-auto border-b border-amber-100">{["Description", "Additional Information", "Shipping & Delivery", "Reviews"].map(item => <button key={item} onClick={() => setTab(item)} className={`shrink-0 border-b-2 px-2 pb-3 text-sm font-semibold ${tab === item ? "border-amber-600 text-amber-700" : "border-transparent text-slate-500"}`}>{item}</button>)}</div>
          <div className="max-w-3xl py-7 text-sm leading-8 text-slate-600">
            {tab === "Description" && (product.description ? <p>{product.description}</p> : <ul className="list-disc space-y-1 pl-5"><li>Crafted in genuine 925 silver and finished with a rich layer of 24K gold plating.</li><li>Traditional gold appearance with the comfort and value of a sterling-silver base.</li><li>Each piece is checked for secure stone setting, clasp strength, polish and plating finish.</li><li>Avoid water, perfume, sweat and harsh chemicals to preserve the gold plating.</li><li>Wipe gently after use and store separately in the provided Annai jewellery pouch.</li></ul>)}
            {tab === "Additional Information" && <div className="grid max-w-xl grid-cols-2 gap-3"><strong>Base metal</strong><span>925 Silver</span><strong>Finish</strong><span>24K Gold Plating</span><strong>Availability</strong><span>{product.inStock === false || product.stock === 0 ? "Out of stock" : "In stock"}</span><strong>Vendor</strong><span>Annai Jewellery</span></div>}
            {tab === "Shipping & Delivery" && <p>All orders are quality checked, securely packed and shipped with insurance. Standard delivery takes 4-7 working days. You will receive tracking details when the order leaves our showroom.</p>}
            {tab === "Reviews" && <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-900">Customer Reviews</h3>
                <button type="button" onClick={() => setReviewFormOpen((open) => !open)} className="rounded-full bg-amber-600 px-5 py-2 text-xs font-semibold text-white shadow-sm">{reviewFormOpen ? "Cancel" : "Add Review"}</button>
              </div>
              {reviewMessage && <p className={`rounded-xl p-3 text-xs ${/published|thank/i.test(reviewMessage) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{reviewMessage}</p>}
              <div className="space-y-3">
                {productReviews.map((review) => <article key={review.id} className="rounded-2xl border border-amber-100 bg-[#fbf8f1] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-slate-900">{review.name}</strong><span className="text-amber-500">{"★".repeat(review.rating)}</span></div>
                  <p className="mt-2 leading-6">{review.text}</p>
                </article>)}
                {!productReviews.length && <p>No reviews yet. Be the first to share your experience.</p>}
              </div>
              {reviewTotalPages > 1 && <nav className="flex items-center justify-center gap-3" aria-label="Review pages">
                <button type="button" disabled={reviewPage <= 1} onClick={() => setReviewPage((page) => Math.max(1, page - 1))} className="rounded-full border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                <span className="min-w-20 text-center text-xs font-semibold text-slate-600">Page {reviewPage} / {reviewTotalPages}</span>
                <button type="button" disabled={reviewPage >= reviewTotalPages} onClick={() => setReviewPage((page) => Math.min(reviewTotalPages, page + 1))} className="rounded-full border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
              </nav>}
              {reviewFormOpen && <form onSubmit={submitProductReview} noValidate className="space-y-3 rounded-2xl border border-amber-100 p-4">
                <h3 className="font-semibold text-slate-900">Add a review</h3>
                <div className="grid gap-3 sm:grid-cols-2"><label><input value={reviewForm.name} onChange={(event) => { setReviewForm({ ...reviewForm, name: event.target.value }); setReviewErrors((current) => ({ ...current, name: "" })); }} placeholder="Your name" aria-invalid={Boolean(reviewErrors.name)} className={`w-full rounded-xl border px-3 py-2 outline-none ${reviewErrors.name ? "border-red-400" : "border-amber-200"}`} />{reviewErrors.name && <span className="mt-1.5 block text-xs font-medium text-red-600">{reviewErrors.name}</span>}</label><select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })} className="rounded-xl border border-amber-200 px-3 py-2 outline-none">{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></div>
                <label className="block"><textarea maxLength={1200} rows={4} value={reviewForm.text} onChange={(event) => { setReviewForm({ ...reviewForm, text: event.target.value }); setReviewErrors((current) => ({ ...current, text: "" })); }} placeholder="Share your experience with this product" aria-invalid={Boolean(reviewErrors.text)} className={`w-full rounded-xl border px-3 py-2 outline-none ${reviewErrors.text ? "border-red-400" : "border-amber-200"}`} />{reviewErrors.text && <span className="mt-1.5 block text-xs font-medium text-red-600">{reviewErrors.text}</span>}</label>
                <button className="rounded-full bg-amber-600 px-5 py-2 text-xs font-semibold text-white">Publish Review</button>
              </form>}
            </div>}
          </div>
        </div>

        <section className="mt-8">
          <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 sm:gap-5"><span className="h-px min-w-8 flex-1 bg-gradient-to-r from-transparent to-amber-400" /><h2 className="shrink-0 text-[1.1rem] font-bold uppercase text-slate-900">Related Products</h2><span className="h-px min-w-8 flex-1 bg-gradient-to-l from-transparent to-amber-400" /></div>
          {related.length ? <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-5">{related.map(item => <Link key={item.name} to={`/product/${productSlug(item.name)}`} className="overflow-hidden rounded-2xl border border-amber-100 bg-white"><img src={item.image} alt={item.name} className="h-40 w-full object-contain transition hover:scale-105 sm:h-72" /><div className="p-3 sm:p-5"><h3 className="text-xs font-semibold sm:text-base">{item.name}</h3><p className="mt-2 text-xs font-semibold text-amber-700 sm:text-sm"><Price value={item.price} /></p></div></Link>)}</div> : <p className="mt-5 text-center text-sm text-slate-500">No other products have been added to this category yet.</p>}</section>
        {recentlyViewed.length > 0 && <section className="mt-10 border-t border-amber-100 pt-8"><div className="text-center"><div className="mx-auto flex max-w-2xl items-center justify-center gap-3 sm:gap-5"><span className="h-px min-w-8 flex-1 bg-gradient-to-r from-transparent to-amber-400" /><h2 className="shrink-0 text-[1.1rem] font-bold uppercase text-slate-900">Recently Viewed</h2><span className="h-px min-w-8 flex-1 bg-gradient-to-l from-transparent to-amber-400" /></div><Link to="/" className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-amber-700">Continue shopping <span aria-hidden="true">&rarr;</span></Link></div><div className="mt-5 grid grid-cols-3 gap-3 sm:gap-5">{recentlyViewed.map(item => <Link key={item.name} to={`/product/${productSlug(item.name)}`} className="group overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="h-40 overflow-hidden bg-[#fbf8f1] sm:h-64"><img src={item.image} alt={item.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" /></div><div className="p-3 sm:p-5">
          {/* <p className="hidden text-[9px] font-semibold uppercase tracking-wider text-amber-600 sm:block">{item.material}</p> */}
          <h3 className="text-xs font-semibold sm:mt-2 sm:text-base">{item.name}</h3><p className="mt-2 text-xs font-semibold text-amber-700 sm:text-sm"><Price value={item.price} /></p></div></Link>)}</div></section>}
      </div>
    </section>
    {imageModal.mounted && <div className={`product-image-modal popup-backdrop-motion ${imageModal.active ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label={`${product.name} full-screen image`} onPointerDown={(event) => { if (event.target === event.currentTarget) setImageModalOpen(false); }}>
      <button type="button" className="product-image-modal-close" onClick={() => setImageModalOpen(false)} aria-label="Close full-screen image" autoFocus><X /></button>
      {gallery.length > 1 && <><button type="button" onClick={() => changeImage(-1)} className="fixed left-3 top-1/2 z-[301] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-amber-800 shadow-xl transition hover:scale-105 sm:left-8 sm:h-12 sm:w-12" aria-label="Previous full-screen image"><ChevronLeft className="h-6 w-6" /></button><button type="button" onClick={() => changeImage(1)} className="fixed right-3 top-1/2 z-[301] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-amber-800 shadow-xl transition hover:scale-105 sm:right-8 sm:h-12 sm:w-12" aria-label="Next full-screen image"><ChevronRight className="h-6 w-6" /></button><span className="fixed bottom-5 left-1/2 z-[301] -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white">{imageIndex + 1} / {gallery.length}</span></>}
      <img src={gallery[imageIndex]} alt={product.name} className="product-image-modal-image popup-surface-motion" />
    </div>}
  </>;
}
