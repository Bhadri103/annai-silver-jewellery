 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CalendarCheck, Check, CreditCard, Filter, Heart, Minus, PackageCheck, Plus, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Star, Truck, X } from "lucide-react";
import { Reveal, SEO, SectionTitle } from "./highgrade/shared";
import { programData } from "./highgrade/data";
import { websiteApi, type WebsiteProduct, type WebsiteUser } from "../lib/api";
import { readCart, writeCart } from "../lib/cart";
import { clean, isEmail, isName, isPhone, limitPhoneDigits, maxLength, minLength, phoneDigits } from "../lib/validation";

const formatPrice = (price: number) => `Rs. ${price.toLocaleString("en-IN")}`;

const EnquiryModal = ({
  title,
  program,
  onClose,
}: {
  title: string;
  program: string;
  onClose: () => void;
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    time: "",
    program,
    message: "",
  });

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-amber-800/70 p-4" role="dialog" aria-modal="true">
      <div className="program-enquiry-modal w-full max-w-xl rounded-[2rem] border p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-600">Highgrade Enquiry</p>
            <h3 className="mt-2 text-2xl font-medium text-amber-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{program}</p>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200" aria-label="Close enquiry form">
            <X className="h-5 w-5" />
          </button>
        </div>
        {submitted ? (
          <div className="rounded-3xl bg-amber-50 p-6 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-amber-600" />
            <h4 className="mt-4 text-xl font-medium text-amber-900">Enquiry submitted</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">Highgrade team will contact you with timing, trainer availability, and next steps.</p>
            <button onClick={onClose} className="mt-5 rounded-full bg-amber-600 px-7 py-3 text-sm font-medium text-white">Done</button>
          </div>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setStatus("Submitting enquiry...");
              const nextErrors: Record<string, string> = {};
              const phone = phoneDigits(form.phone);
              if (!isName(form.name)) nextErrors.name = "Enter a valid full name.";
              if (!isPhone(phone)) nextErrors.phone = "Enter a valid 10 digit mobile number.";
              if (!isEmail(form.email)) nextErrors.email = "Enter a valid email address or leave it empty.";
              if (!maxLength(form.time, 80)) nextErrors.time = "Preferred time must be 80 characters or less.";
              if (!maxLength(form.message, 500)) nextErrors.message = "Message must be 500 characters or less.";
              setErrors(nextErrors);
              if (Object.keys(nextErrors).length) {
                setStatus("");
                return;
              }
              try {
                await websiteApi.createEnquiry({
                  name: clean(form.name),
                  phone,
                  email: clean(form.email),
                  program: clean(form.program),
                  source: "Program page",
                  message: `${clean(form.message)}${clean(form.time) ? ` Preferred time: ${clean(form.time)}` : ""}`,
                });
                setSubmitted(true);
              } catch (error) {
                setStatus(error instanceof Error ? error.message : "Unable to submit enquiry.");
              }
            }}
          >
            <div><input required minLength={2} maxLength={80} pattern="[A-Za-z][A-Za-z .'-]{1,79}" value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Full name" className={`shop-input w-full rounded-2xl border px-4 py-3 text-sm outline-none ${errors.name ? "border-amber-500" : ""}`} />{errors.name && <p className="mt-1 text-xs text-amber-600">{errors.name}</p>}</div>
            <div><input required type="tel" inputMode="numeric" minLength={10} maxLength={10} pattern="[6-9][0-9]{9}" value={form.phone} onChange={(event) => updateForm("phone", limitPhoneDigits(event.target.value))} placeholder="Phone number" className={`shop-input w-full rounded-2xl border px-4 py-3 text-sm outline-none ${errors.phone ? "border-amber-500" : ""}`} />{errors.phone && <p className="mt-1 text-xs text-amber-600">{errors.phone}</p>}</div>
            <div><input type="email" maxLength={120} value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="Email address" className={`shop-input w-full rounded-2xl border px-4 py-3 text-sm outline-none ${errors.email ? "border-amber-500" : ""}`} />{errors.email && <p className="mt-1 text-xs text-amber-600">{errors.email}</p>}</div>
            <div><input maxLength={80} value={form.time} onChange={(event) => updateForm("time", event.target.value)} placeholder="Preferred time" className={`shop-input w-full rounded-2xl border px-4 py-3 text-sm outline-none ${errors.time ? "border-amber-500" : ""}`} />{errors.time && <p className="mt-1 text-xs text-amber-600">{errors.time}</p>}</div>
            <select value={form.program} onChange={(event) => updateForm("program", event.target.value)} className="shop-input rounded-2xl border px-4 py-3 text-sm outline-none">
              <option>{program}</option>
              <option>Personal Training</option>
              <option>Women Training</option>
              <option>Cross Fit Training</option>
              <option>Supplement Purchase</option>
              <option>Academy Workshop</option>
            </select>
            <div><textarea maxLength={500} value={form.message} onChange={(event) => updateForm("message", event.target.value)} placeholder="Goal or message" className={`shop-input min-h-28 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${errors.message ? "border-amber-500" : ""}`} />{errors.message && <p className="mt-1 text-xs text-amber-600">{errors.message}</p>}</div>
            <button className="rounded-full bg-amber-600 px-7 py-3 text-sm font-medium text-white">Submit Enquiry</button>
            {status && <p className="text-sm text-slate-600">{status}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

const SupplementShop = ({ program }: { program: any }) => {
  const checkoutRef = useRef<HTMLElement | null>(null);
  const [apiProducts, setApiProducts] = useState<WebsiteProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const products = useMemo(() => apiProducts.length ? apiProducts : program.shopProducts || [], [apiProducts, program.shopProducts]);
  const [category, setCategory] = useState("All");
  const [goal, setGoal] = useState("All");
  const [sort, setSort] = useState("popular");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>(() => readCart());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [banners, setBanners] = useState<Array<{ id: string | number; title: string; imageUrl: string; description?: string }>>([]);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [coupon, setCoupon] = useState("");
  const [delivery, setDelivery] = useState("Pickup");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [checkoutErrors, setCheckoutErrors] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [member, setMember] = useState<WebsiteUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("highgrade_user_profile") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let ignore = false;
    websiteApi.products()
      .then((data) => {
        if (!ignore) setApiProducts(data.products || []);
      })
      .catch(() => {
        if (!ignore) setApiProducts([]);
      })
      .finally(() => {
        if (!ignore) setLoadingProducts(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    websiteApi.gallery()
      .then((data) => {
        if (ignore) return;
        const supplementBanners = (data.galleryItems || [])
          .filter((item) => item.isVisible !== false && item.imageUrl && item.category === "Supplement Banner")
          .map((item) => ({ id: item.id, title: item.title, imageUrl: item.imageUrl, description: item.description }));
        setBanners(supplementBanners);
      })
      .catch(() => setBanners([]));
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    writeCart(cart);
  }, [cart]);

  useEffect(() => {
    if (!localStorage.getItem("highgrade_user_token")) return;
    websiteApi.profile()
      .then((data) => {
        setMember(data);
        setIsLoggedIn(true);
        setName(data.name || data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        localStorage.setItem("highgrade_user_profile", JSON.stringify(data));
      })
      .catch(() => {
        localStorage.removeItem("highgrade_user_token");
        localStorage.removeItem("highgrade_user_profile");
        setMember(null);
        setIsLoggedIn(false);
      });
    websiteApi.wishlist()
      .then((data) => {
        const next: Record<string, boolean> = {};
        (data.products || []).forEach((item) => {
          next[String(item.id)] = true;
        });
        setWishlist(next);
      })
      .catch(() => undefined);
  }, []);

  const categories = ["All", ...Array.from(new Set(products.map((item: any) => item.category).filter(Boolean)))];
  const goals = ["All", ...Array.from(new Set(products.map((item: any) => item.goal).filter(Boolean)))];

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((item: any) => {
      const categoryMatch = category === "All" || item.category === category;
      const goalMatch = goal === "All" || item.goal === goal;
      const searchMatch = !query || `${item.name} ${item.category || ""} ${item.goal || ""} ${item.flavor || ""}`.toLowerCase().includes(query);
      return categoryMatch && goalMatch && searchMatch;
    });

    return [...filtered].sort((a: any, b: any) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return b.stock - a.stock;
    });
  }, [category, goal, products, search, sort]);

  const cartItems = products
    .filter((item: any) => cart[item.id])
    .map((item: any) => ({ ...item, quantity: cart[item.id] }));
  const lastAddedProduct = cartItems.find((item: any) => String(item.id) === String(lastAddedId)) || cartItems[cartItems.length - 1];
  const checkoutListItems = lastAddedProduct ? cartItems.filter((item: any) => String(item.id) !== String(lastAddedProduct.id)) : cartItems;
  const subtotal = cartItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const discount = coupon.trim().toUpperCase() === "HIGHGRADE10" ? Math.round(subtotal * 0.1) : 0;
  const deliveryFee = delivery === "Delivery" && subtotal > 0 ? 99 : 0;
  const total = Math.max(subtotal - discount + deliveryFee, 0);
  const productImage = (product: any) => product.image || product.imageUrl || program.image;
  const productBadge = (product: any) => product.badge || product.goal || product.category || "Highgrade";
  const productStock = (product: any) => Math.max(Number(product?.stock || 0), 0);
  const isProductAvailable = (product: any) => productStock(product) > 0 && product?.inStock !== false;
  const cartQuantity = (id: string | number) => Number(cart[String(id)] || 0);

  const heroBanners = banners.length ? banners : [{ id: "default", title: "Shop coach-approved products.", imageUrl: program.image, description: "Add the right stack, login as buyer, and checkout through PhonePe with pickup or delivery." }];

  const addToCart = (id: string | number) => {
    const key = String(id);
    const product = products.find((item: any) => String(item.id) === String(id));
    const stock = productStock(product);
    if (!product || !isProductAvailable(product)) {
      setMessage("This product is out of stock.");
      return;
    }
    if (cartQuantity(id) >= stock) {
      setMessage(`Only ${stock} item(s) available in stock.`);
      return;
    }
    setCart((current) => ({ ...current, [key]: Math.min((current[key] || 0) + 1, stock) }));
    setLastAddedId(String(id));
    setSelectedProduct(null);
    setOrderPlaced(false);
    setMessage("Product added to cart.");
  };

  const updateQuantity = (id: string | number, change: number) => {
    const key = String(id);
    const product = products.find((item: any) => String(item.id) === String(id));
    const stock = productStock(product);
    if (change > 0 && (!product || !isProductAvailable(product))) {
      setMessage("This product is out of stock.");
      return;
    }
    setCart((current) => {
      const nextQuantity = Math.min(Math.max((current[key] || 0) + change, 0), stock);
      const next = { ...current };
      if (nextQuantity === 0) {
        delete next[key];
      } else {
        next[key] = nextQuantity;
      }
      return next;
    });
    if (change > 0 && cartQuantity(id) >= stock) setMessage(`Only ${stock} item(s) available in stock.`);
  };

  const handleLogin = () => {
    const nextErrors: Record<string, string> = {};
    if (!minLength(name, 2) || !maxLength(name, 120)) nextErrors.name = "Enter your buyer name or email.";
    if (!minLength(password, 6) || !maxLength(password, 72)) nextErrors.password = "Password must be 6 to 72 characters.";
    setCheckoutErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    websiteApi.login({ loginIdentifier: clean(name), password })
      .then((user) => {
        localStorage.setItem("highgrade_user_token", user.token);
        localStorage.setItem("highgrade_user_profile", JSON.stringify(user));
        setMember(user);
        setPhone(user.phone || "");
        setAddress(user.address || "");
        setIsLoggedIn(true);
        setCheckoutErrors({});
        setMessage("Logged in. Checkout is unlocked.");
      })
      .catch((error) => {
        setCheckoutErrors({ password: "Invalid buyer login." });
        setMessage(error instanceof Error ? error.message : "Invalid buyer login.");
      });
  };

  const toggleWishlist = async (product: any) => {
    if (!member && !localStorage.getItem("highgrade_user_token")) {
      setMessage("Please login to save wishlist products.");
      setWishlist((current) => ({ ...current, [product.id]: !current[product.id] }));
      return;
    }
    const active = Boolean(wishlist[product.id]);
    setWishlist((current) => ({ ...current, [product.id]: !active }));
    try {
      if (active) await websiteApi.removeWishlist(product.id);
      else await websiteApi.addWishlist(product.id);
      setMessage(active ? "Removed from wishlist." : "Added to wishlist.");
    } catch (error) {
      setWishlist((current) => ({ ...current, [product.id]: active }));
      setMessage(error instanceof Error ? error.message : "Unable to update wishlist.");
    }
  };

  const handlePurchase = async () => {
    const nextErrors: Record<string, string> = {};
    const overStockItem = cartItems.find((item: any) => !isProductAvailable(item) || item.quantity > productStock(item));
    if (!cartItems.length) {
      setMessage("Add at least one product before checkout.");
      return;
    }
    if (overStockItem) {
      setMessage(isProductAvailable(overStockItem) ? `Only ${productStock(overStockItem)} ${overStockItem.name} item(s) available.` : `${overStockItem.name} is out of stock.`);
      return;
    }
    if (!isLoggedIn && !member) {
      setMessage("Please login before purchase.");
      return;
    }
    const validPhone = phoneDigits(phone || member?.phone);
    if (!isPhone(validPhone)) nextErrors.phone = "Enter a valid 10 digit phone number.";
    if (delivery === "Delivery" && !minLength(address, 8)) nextErrors.address = "Enter a complete delivery address.";
    else if (!maxLength(address, 300)) nextErrors.address = "Delivery address must be 300 characters or less.";
    if (!maxLength(coupon, 40)) nextErrors.coupon = "Coupon code must be 40 characters or less.";
    setCheckoutErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setPlacingOrder(true);
    setMessage("Opening PhonePe checkout...");
    try {
      const payment = await websiteApi.createPhonePePayment({
        customerName: clean(member?.name || name),
        customerEmail: clean(member?.email || (name.includes("@") ? name : "")),
        customerPhone: validPhone,
        items: cartItems.map((item: any) => ({
          id: item.id,
          productId: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
        })),
        amount: total,
        deliveryMode: delivery,
        deliveryAddress: delivery === "Delivery" ? clean(address) : program.location,
        notes: clean(coupon) ? `Coupon used: ${clean(coupon)}` : "Website supplement checkout",
      });
      localStorage.setItem("highgrade_pending_phonepe", JSON.stringify({
        transactionId: payment.merchantTransactionId,
        orderId: payment.order.orderId,
        total,
      }));
      window.location.href = payment.redirectUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order failed. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <section className="shop-section px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-7xl">
        {/* <SectionTitle
          kicker="Highgrade Shop"
          title="Highgrade Supplement Store"
          text="A complete dummy ecommerce flow for proteins, strength support, recovery stacks, and coach-approved supplement buying."
        /> 
        <Reveal className="mb-8 flex justify-center">
          <button onClick={() => setShowEnquiry(true)} className="rounded-full border border-amber-500 px-7 py-3 text-sm font-medium text-amber-600 transition hover:bg-amber-600 hover:text-white">
            Supplement Enquiry
          </button>
        </Reveal> */}

        <Reveal>
          <div className="mb-4 flex items-center gap-2 lg:hidden">
            <label className="shop-input-wrap flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-3">
              <Search className="h-5 w-5 text-amber-600" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
            <button onClick={() => setFiltersOpen(true)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-lg shadow-amber-600/20" aria-label="Open filters">
              <Filter className="h-5 w-5" />
            </button>
          </div>
          <div className="shop-top-grid mb-6 grid gap-4 rounded-[1.5rem] border p-3 shadow-sm lg:grid-cols-[1fr_0.72fr]">
            <div className="supplement-banner-slider relative min-h-[250px] overflow-hidden rounded-[1.2rem] p-5 sm:min-h-[290px]">
              {heroBanners.map((banner, index) => (
                <img key={banner.id} src={banner.imageUrl} alt={banner.title} className="supplement-banner-slide absolute inset-0 h-full w-full object-cover object-center" style={{ animationDelay: `${index * 5}s` }} />
              ))}
              <div className="absolute inset-0 bg-amber-800/62" />
              <div className="relative max-w-lg text-white">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-300">Sports and Supplements</p>
                <h3 className="mt-2 max-w-md text-2xl font-medium leading-tight sm:text-3xl">{heroBanners[0]?.title || "Shop coach-approved products."}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/75">{heroBanners[0]?.description || "Add the right stack, login as buyer, and checkout through PhonePe with pickup or delivery."}</p>
                {/* <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {[
                    [PackageCheck, "Original stock"],
                    [Truck, "Pickup / delivery"],
                    [ShieldCheck, "Buyer login"],
                  ].map(([Icon, label]) => (
                    <span key={label as string} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs">
                      <Icon className="h-4 w-4 text-amber-300" /> {label as string}
                    </span>
                  ))}
                </div> */}
              </div>
            </div>
            <div className="shop-surface hidden rounded-[1.2rem] p-4 lg:block">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-medium">Product Filters</h3>
              </div>
              <div className="mt-5 grid gap-3">
                <label className="shop-input-wrap flex items-center gap-3 rounded-2xl border px-4 py-3">
                  <Search className="h-5 w-5 text-amber-600" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search protein, creatine, recovery..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                </label>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <select value={category} onChange={(event) => setCategory(event.target.value)} className="shop-input rounded-2xl border px-4 py-3 text-sm outline-none">
                    {categories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <select value={goal} onChange={(event) => setGoal(event.target.value)} className="shop-input rounded-2xl border px-4 py-3 text-sm outline-none">
                    {goals.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <select value={sort} onChange={(event) => setSort(event.target.value)} className="shop-input rounded-2xl border px-4 py-3 text-sm outline-none">
                    <option value="popular">Popular</option>
                    <option value="rating">Top rated</option>
                    <option value="low">Price low to high</option>
                    <option value="high">Price high to low</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {goals.map((item) => (
                    <button key={item} onClick={() => setGoal(item)} className={`shop-chip rounded-full border px-4 py-2 text-xs transition ${goal === item ? "is-active" : ""}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {filtersOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
            <button className="absolute inset-0 bg-amber-800/60" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />
            <div className="shop-filter-drawer absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col border-r p-4 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="h-5 w-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-amber-900">Filters</h3>
                </div>
                <button onClick={() => setFiltersOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200" aria-label="Close filters">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-3">
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="shop-input rounded-2xl border px-4 py-3 text-sm outline-none">
                  {categories.map((item) => <option key={item}>{item}</option>)}
                </select>
                <select value={goal} onChange={(event) => setGoal(event.target.value)} className="shop-input rounded-2xl border px-4 py-3 text-sm outline-none">
                  {goals.map((item) => <option key={item}>{item}</option>)}
                </select>
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="shop-input rounded-2xl border px-4 py-3 text-sm outline-none">
                  <option value="popular">Popular</option>
                  <option value="rating">Top rated</option>
                  <option value="low">Price low to high</option>
                  <option value="high">Price high to low</option>
                </select>
                <div className="flex flex-wrap gap-2 pt-2">
                  {goals.map((item) => (
                    <button key={item} onClick={() => setGoal(item)} className={`shop-chip rounded-full border px-4 py-2 text-xs transition ${goal === item ? "is-active" : ""}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setFiltersOpen(false)} className="mt-auto rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white">Apply filters</button>
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Highgrade inventory</p>
            <h3 className="mt-1 text-2xl font-semibold text-amber-900">Supplements</h3>
          </div>
          <div className="shop-cart-summary flex items-center rounded-2xl border px-4 py-2">
            <div>
              <p className="text-sm font-semibold text-amber-900">{cartItems.length} item{cartItems.length === 1 ? "" : "s"}</p>
              <p className="text-xs text-slate-500">{formatPrice(subtotal)} cart value</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:h-[calc(100dvh-7.5rem)] lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden">
          <div className="scrollbar-hide grid grid-cols-2 items-start gap-3 sm:gap-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-2 xl:grid-cols-3">
            {loadingProducts && (
              <div className="shop-muted-panel col-span-2 rounded-2xl p-4 text-sm xl:col-span-3">
                Loading live products from Highgrade inventory...
              </div>
            )}
            {filteredProducts.map((product: any, index: number) => (
              <Reveal key={product.id} delay={index * 50}>
                <article className={`shop-product-card group flex h-[300px] flex-col overflow-hidden rounded-[1rem] border shadow-sm transition hover:-translate-y-1 sm:h-[365px] sm:rounded-[1.35rem] ${!isProductAvailable(product) ? "opacity-70" : ""}`}>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`shop-wishlist-button absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm sm:h-9 sm:w-9 ${wishlist[product.id] ? "is-active" : ""}`}
                    aria-label="Toggle wishlist"
                  >
                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${wishlist[product.id] ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>
                  <button onClick={() => setSelectedProduct(product)} className="shop-product-image-stage relative mx-2 mt-2 h-32 overflow-hidden rounded-[0.9rem] text-left sm:mx-3 sm:mt-3 sm:h-40">
                    <img src={productImage(product)} alt={product.name} className="h-full w-full object-contain p-2 transition group-hover:scale-105 sm:p-3" />
                    <span className="shop-product-badge absolute left-2 top-2 max-w-[70%] truncate rounded-full px-2.5 py-1 text-[10px] font-semibold text-white sm:text-xs">{isProductAvailable(product) ? productBadge(product) : "Out of stock"}</span>
                  </button>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <button onClick={() => setSelectedProduct(product)} className="text-left">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600 sm:text-xs">{product.category}</span>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-amber-900 sm:text-lg">{product.name}</h3>
                    </button>
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">{product.goal} support</p>
                        <p className={`mt-1 truncate text-[11px] sm:text-xs ${isProductAvailable(product) ? "text-slate-500" : "text-amber-600"}`}>{product.flavor} | {isProductAvailable(product) ? `${productStock(product)} in stock` : "Out of stock"}</p>
                      </div>
                      <span className="shop-rating-pill flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs text-slate-600"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {product.rating}</span>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:pt-4">
                      <p className="text-base font-medium text-amber-600 sm:text-xl">{formatPrice(product.price)}</p>
                      {cart[product.id] ? (
                        <div className="shop-card-stepper flex items-center rounded-full border">
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-amber-600 transition hover:bg-amber-50"
                            aria-label={`Remove one ${product.name}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-7 text-center text-sm font-semibold text-amber-900">{cart[product.id]}</span>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            disabled={cartQuantity(product.id) >= productStock(product)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-600 text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-45"
                            aria-label={`Add one more ${product.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button disabled={!isProductAvailable(product)} onClick={() => addToCart(product.id)} className="rounded-full bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:px-4 sm:py-2 sm:text-sm">{isProductAvailable(product) ? "Add" : "Sold"}</button>
                      )}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={100}>
            <aside ref={checkoutRef} className="shop-checkout-panel shop-surface scroll-mt-28 rounded-[1.5rem] border p-4 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-hidden">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Checkout</p>
                  <h3 className="text-xl font-semibold text-amber-900">Cart</h3>
                </div>
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-amber-600 text-white">
                  <ShoppingBag className="h-5 w-5" />
                  {cartItems.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-amber-600">{cartItems.length}</span>}
                </div>
              </div>
              {lastAddedProduct && (
                <div className="shop-cart-line mb-4 flex items-center gap-3 rounded-2xl border p-3">
                  <img src={productImage(lastAddedProduct)} alt={lastAddedProduct.name} className="h-14 w-14 rounded-xl bg-white object-contain p-1" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">Added to cart</p>
                    <p className="truncate text-sm font-medium text-amber-900">{lastAddedProduct.name}</p>
                    <p className="text-xs text-slate-500">{cart[lastAddedProduct.id] || lastAddedProduct.quantity} item(s)</p>
                  </div>
                  <Check className="h-5 w-5 shrink-0 text-green-500" />
                </div>
              )}
              <div className="scrollbar-hide space-y-3 lg:max-h-[min(28vh,220px)] lg:overflow-y-auto lg:pr-1">
                {checkoutListItems.length ? checkoutListItems.map((item: any) => (
                  <div key={item.id} className="shop-cart-line rounded-2xl border p-3">
                    <div className="grid grid-cols-[54px_1fr] gap-3">
                      <img src={productImage(item)} alt={item.name} className="h-14 w-14 rounded-xl bg-white object-contain p-1" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{formatPrice(item.price)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="rounded-full border border-slate-200 p-1"><Minus className="h-4 w-4" /></button>
                          <span className="w-5 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="rounded-full border border-slate-200 p-1"><Plus className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : !lastAddedProduct && <p className="shop-muted-panel rounded-2xl p-4 text-sm">Your cart is empty. Add a product to start checkout.</p>}
              </div>

              <div className="my-5 border-t border-slate-100" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-500">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-slate-500">Total</span>
                <span className="text-2xl font-medium text-amber-900">{formatPrice(subtotal)}</span>
                </div>
              </div>
              <Link to="/cart" className="shop-secondary-button mt-5 flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold">View Cart</Link>
              <Link to="/checkout" className={`shop-primary-button mt-3 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${cartItems.length ? "" : "pointer-events-none opacity-50 grayscale"}`}>
                <CreditCard className="h-5 w-5" /> Checkout
              </Link>
              {(member || isLoggedIn) && <p className="shop-success mt-4 rounded-2xl p-3 text-sm leading-6"><ShieldCheck className="mr-2 inline h-4 w-4" /> Logged in as {member?.name || name}. Orders save to your profile.</p>}
              {message && <p className="shop-message mt-4 rounded-2xl p-3 text-sm leading-6">{message}</p>}
            </aside>
          </Reveal>
        </div>

         

        <Reveal className="shop-map-card mt-5 overflow-hidden rounded-[1.5rem] border p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Store map</p>
              <h3 className="mt-1 text-xl font-semibold text-amber-900">Highgrade Sports & Supplements</h3>
              <p className="mt-1 text-sm text-slate-500">Open the exact supplement store location in Nagercoil.</p>
            </div>
            <a href="https://share.google/OCQXjxm89MHPfY7bx" target="_blank" rel="noreferrer" className="shop-secondary-button inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-xs font-semibold">
              Open in Maps
            </a>
          </div>
          <div className="shop-map-frame overflow-hidden rounded-[1.25rem] border">
            <iframe
              title="Highgrade Sports and Supplements location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3949.239827171334!2d77.42894617477039!3d8.178577991852627!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b04f172e8125f31%3A0x7ed3ed86e9aafc68!2sHighgrade%20Sports%20%26%20Supplements!5e0!3m2!1sen!2sin!4v1783751553549!5m2!1sen!2sin"
              className="h-72 w-full border-0 sm:h-80 lg:h-[420px]"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </Reveal>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-amber-800/70 p-4" role="dialog" aria-modal="true">
          <div className="shop-surface max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[1.5rem] border shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-amber-600">Product details</p>
                <h3 className="mt-1 truncate text-xl font-semibold text-amber-900 sm:text-2xl">{selectedProduct.name}</h3>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200" aria-label="Close product details">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-5rem)] overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-5 md:grid-cols-[0.86fr_1fr]">
                <div className="relative rounded-[1.25rem] border border-slate-100 bg-white p-4">
                  <span className="shop-product-badge absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium text-white">{isProductAvailable(selectedProduct) ? productBadge(selectedProduct) : "Out of stock"}</span>
                  <img src={productImage(selectedProduct)} alt={selectedProduct.name} className="h-64 w-full object-contain sm:h-80" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">{selectedProduct.category}</span>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">{selectedProduct.brand || "Highgrade"}</span>
                    <span className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {selectedProduct.rating}</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {selectedProduct.description || `${selectedProduct.goal} support with ${selectedProduct.flavor} flavor. Suitable for Highgrade members who want a simple supplement routine connected to their training plan.`}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Rating", selectedProduct.rating],
                    ["Stock", isProductAvailable(selectedProduct) ? productStock(selectedProduct) : "Out of stock"],
                    ["Price", formatPrice(selectedProduct.price)],
                  ].map(([label, value]) => (
                    <div key={label as string} className="shop-muted-panel rounded-2xl p-3">
                      <p className="text-xs uppercase tracking-[0.18em]">{label as string}</p>
                      <p className="mt-2 text-lg font-medium text-amber-900">{value as string}</p>
                    </div>
                  ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3">
                    <div>
                      <p className="text-xs text-slate-500">Total in cart</p>
                      <p className="text-xl font-semibold text-amber-900">{cartQuantity(selectedProduct.id)} / {productStock(selectedProduct)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(selectedProduct.id, -1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                      <button disabled={!isProductAvailable(selectedProduct) || cartQuantity(selectedProduct.id) >= productStock(selectedProduct)} onClick={() => addToCart(selectedProduct.id)} className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">{isProductAvailable(selectedProduct) ? "Add To Cart" : "Out of Stock"}</button>
                      <button disabled={!isProductAvailable(selectedProduct) || cartQuantity(selectedProduct.id) >= productStock(selectedProduct)} onClick={() => updateQuantity(selectedProduct.id, 1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 disabled:cursor-not-allowed disabled:opacity-45" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <Link
                    to="/cart"
                    onClick={() => addToCart(selectedProduct.id)}
                    className={`mt-4 block w-full rounded-full border border-amber-500 px-5 py-2.5 text-center text-sm font-medium text-amber-600 transition hover:bg-amber-600 hover:text-white ${!isProductAvailable(selectedProduct) ? "pointer-events-none opacity-50 grayscale" : ""}`}
                  >
                    Add and view cart
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEnquiry && (
        <EnquiryModal
          title={program.enquiryTitle || "Supplement Enquiry"}
          program={program.title}
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </section>
  );
};

const ProgramContent = ({ program }: { program: any }) => {
  const [showEnquiry, setShowEnquiry] = useState(false);
  const trainerPhoto = program.trainerPhoto || program.image;

  return (
  <section className="program-detail-section px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
    <div className="mx-auto max-w-6xl">
      <SectionTitle
        title={program.detailTitle || `${program.title} plan`}
        text={program.detailText || "A focused Highgrade plan with coaching, progress review, and clear next steps."}
      />

      <Reveal className="program-trainer-panel mb-14 grid overflow-hidden rounded-[2rem] border md:grid-cols-[0.78fr_1fr]">
        <div className="relative min-h-[340px]">
          <img src={trainerPhoto} alt={`${program.trainer || "Highgrade coach"} trainer`} className="absolute inset-0 h-full w-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/75 via-amber-800/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-200">Trainer</p>
            <h3 className="mt-2 text-3xl font-medium">{program.trainer || "Highgrade Coach"}</h3>
            <p className="mt-1 text-sm text-white/75">{program.trainerRole || "Program coach"}</p>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-600">Program Focus</p>
          <h3 className="mt-3 text-3xl font-medium text-amber-900">Structured coaching without confusion.</h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">{program.detailText}</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
  {(program.stats || []).map(([value, label]: [string, string]) => (
    <div key={label} className="program-metric-line">
      <p className="text-xl font-medium text-amber-600">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{label}</p>
    </div>
  ))}
</div>
          <button onClick={() => setShowEnquiry(true)} className="mt-7 rounded-full bg-amber-600 px-7 py-3 text-sm font-medium text-white shadow-lg shadow-amber-600/20">
            Enquiry Form
          </button>
        </div>
      </Reveal>

      {program.pagePhotos && (
        <div className="mb-14 grid gap-4 md:grid-cols-2">
          {program.pagePhotos.slice(0, 2).map((photo: string, index: number) => (
            <Reveal key={photo} delay={index * 70}>
              <img
                src={photo}
                alt={`${program.title} coaching photo ${index + 1}`}
                className="h-72 w-full rounded-[1.5rem] object-contain"
              />
            </Reveal>
          ))}
        </div>
      )}

      <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-600">What You Get</p>
            <h3 className="mt-3 text-3xl font-medium text-amber-900">Point-by-point training support</h3>
            <div className="mt-7 divide-y divide-slate-100">
              {program.features.map((feature: string, index: number) => (
                <div key={feature} className="flex gap-4 py-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-600 text-[11px] font-medium text-white">{index + 1}</span>
                  <div>
                    <h4 className="font-medium text-amber-900">{feature}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Clear instruction, progression, and review checkpoints so you know the next action.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="program-list-panel rounded-[1.5rem] border p-6">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-600">Highlights</p>
            <ul className="mt-5 space-y-4">
              {(program.highlights || []).map((item: string) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-amber-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="my-6 h-px bg-slate-100" />
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-600">Schedule</p>
            <ul className="mt-5 space-y-4">
              {(program.schedule || []).map((item: string) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <CalendarCheck className="mt-1 h-4 w-4 shrink-0 text-amber-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      {program.process && (
        <Reveal className="mt-16">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-600">How It Works</p>
            <h3 className="program-section-title mt-3 text-3xl font-medium">A simple path from first visit to progress.</h3>
          </div>
          <div className="program-process-line mt-8 grid gap-4 md:grid-cols-4">
            {program.process.map((step: string, index: number) => (
              <div key={step} className="program-process-card relative rounded-[1.5rem] border p-5">
                <span className="program-process-step mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white">0{index + 1}</span>
                <h4 className="program-process-title text-base font-medium leading-6">{step}</h4>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal className="program-cta-panel mt-14 overflow-hidden rounded-[2rem]">
        <div className="program-cta-inner">
          <div className="p-7 text-white lg:p-10">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-300">Start with Highgrade</p>
            <h2 className="mt-3 text-3xl font-medium">Book this program and get a clear starting plan.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Meet the coach, discuss your goal, review your current fitness level, and choose the right training route without confusion.
            </p>
            <button onClick={() => setShowEnquiry(true)} className="mt-6 inline-flex rounded-full bg-amber-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-amber-600/25 transition hover:bg-amber-700">Open Enquiry Form</button>
          </div>
        </div>
      </Reveal>
    </div>
    {showEnquiry && (
      <EnquiryModal
        title={program.enquiryTitle || `Enquire for ${program.title}`}
        program={program.title}
        onClose={() => setShowEnquiry(false)}
      />
    )}
  </section>
  );
};

const ProgramDetailPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const program = location.pathname === "/supplements"
    ? programData.find((item) => item.slug === "highgrade-supplement") || programData[0]
    : programData.find((item) => item.slug === slug) || programData[0];
  const isSupplementShop = program.slug === "highgrade-supplement";

  return (
    <>
      <SEO title={program.title} description={`${program.title} program at Highgrade Fitness Nagercoil.`} />
      {isSupplementShop ? <SupplementShop program={program} /> : <ProgramContent program={program} />}
    </>
  );
};

export default ProgramDetailPage;
