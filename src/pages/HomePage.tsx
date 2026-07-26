import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Award, CalendarCheck, Eye, Gem, Heart, MessageCircle, Minus, Phone, Plus, Send, ShieldCheck, ShoppingBag, Sparkles, Star, Truck, X } from "lucide-react";
import { Link } from "react-router-dom";
import earring1 from "../assets/earings/1.png";
import earring2 from "../assets/earings/2.png";
import earring3 from "../assets/earings/3.png";
import earring4 from "../assets/earings/4.png";
import earring5 from "../assets/earings/5.png";
import earring6 from "../assets/earings/6.png";
import earring7 from "../assets/earings/7.png";
import earring8 from "../assets/earings/8.png";
import earring9 from "../assets/earings/9.png";
import earring10 from "../assets/earings/10.png";
import earring11 from "../assets/earings/11.png";
import bangle1 from "../assets/bangles/1.png";
import bangle2 from "../assets/bangles/2.png";
import bangle3 from "../assets/bangles/3.png";
import bangle4 from "../assets/bangles/4.png";
// import bangle5 from "../assets/bangles/5.png";
import bangle6 from "../assets/bangles/6.png";
import bangle7 from "../assets/bangles/7.png";
import bangle8 from "../assets/bangles/8.png";
import bangle9 from "../assets/bangles/9.png";
import bangle10 from "../assets/bangles/10.png";
import bangle11 from "../assets/bangles/11.png";
import bangle12 from "../assets/bangles/12.png";
import bangle13 from "../assets/bangles/13.png";
import bangle14 from "../assets/bangles/14.png";
import bangle15 from "../assets/bangles/15.png";
import bangle16 from "../assets/bangles/16.png";
import bangle17 from "../assets/bangles/17.png";
import bangle18 from "../assets/bangles/18.png";
import bangle19 from "../assets/bangles/19.png";
import bangle20 from "../assets/bangles/20.png";
import bangle21 from "../assets/bangles/21.png";
import bangle22 from "../assets/bangles/22.png";
import bangle23 from "../assets/bangles/23.png";
import bangle24 from "../assets/bangles/24.png";
import bangle25 from "../assets/bangles/25.png";
import chain1 from "../assets/chains/1.png";
import chain2 from "../assets/chains/2.png";
import chain3 from "../assets/chains/3.png";
import chain4 from "../assets/chains/4.png";
import chain5 from "../assets/chains/5.png";
import chain6 from "../assets/chains/6.png";
import chain7 from "../assets/chains/7.png";
import chain8 from "../assets/chains/8.png";
import chain9 from "../assets/chains/9.png";
import chain10 from "../assets/chains/10.png";
import chain11 from "../assets/chains/11.png";
import chain12 from "../assets/chains/12.png";
import chain13 from "../assets/chains/13.png";
import chain14 from "../assets/chains/14.png";
import chain15 from "../assets/chains/15.png";
import chain16 from "../assets/chains/16.png";
import chain17 from "../assets/chains/17.png";
import chain18 from "../assets/chains/18.png";
import chain19 from "../assets/chains/19.png";
import chain20 from "../assets/chains/20.png";
import chain21 from "../assets/chains/21.png";
import chain22 from "../assets/chains/22.png";
import chain23 from "../assets/chains/23.png";
import chain24 from "../assets/chains/24.png";
import necklace1 from "../assets/necklace/1.png";
import necklace2 from "../assets/necklace/2.png";
import necklace3 from "../assets/necklace/3.png";
import necklace4 from "../assets/necklace/4.png";
import necklace5 from "../assets/necklace/5.png";
import necklace6 from "../assets/necklace/6.png";
import necklace7 from "../assets/necklace/7.png";
import necklace8 from "../assets/necklace/8.png";
import necklace9 from "../assets/necklace/9.png";
import necklace10 from "../assets/necklace/10.png";
import necklace11 from "../assets/necklace/11.png";
import necklace12 from "../assets/necklace/12.png";
import necklace13 from "../assets/necklace/13.png";
import necklace14 from "../assets/necklace/14.png";
import necklace15 from "../assets/necklace/15.png";
import necklace16 from "../assets/necklace/16.png";
import necklace17 from "../assets/necklace/17.png";
import necklace18 from "../assets/necklace/18.png";
import necklace19 from "../assets/necklace/19.png";
import necklace20 from "../assets/necklace/20.png";
import necklace21 from "../assets/necklace/21.png";
import necklace22 from "../assets/necklace/22.png";
import necklace23 from "../assets/necklace/23.png";
import necklace24 from "../assets/necklace/24.png";
import heroImage from "../assets/jewellery/hero-editorial.png";
import templeNecklace from "../assets/jewellery/temple-necklace.png";
import { readCart, writeCart } from "../lib/cart";
import ZoomableProductImage from "../components/ZoomableProductImage";
import Price from "../components/Price";
import { Card, Reveal, SectionTitle, SEO } from "./highgrade/shared";

const collections = [
  { title: "Necklaces", image: necklace1 },
  { title: "Bangles", image: bangle1 },
  { title: "Earrings", image: earring1 },
  { title: "Chains", image: chain1 },
];

const promises = [
  [ShieldCheck, "Certified 925 Silver", "Every ornament uses a quality-checked 925 silver base with 24K gold plating."],
  [Sparkles, "Master Craftsmanship", "Skilled artisans bring traditional details to life by hand."],
  [Heart, "Lifetime Care", "Complimentary cleaning and dedicated after-sales assistance."],
] as const;

export type Product = { name: string; material: string; price: string; image: string; badge?: string };
export const productSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const productShelves: { id: string; kicker: string; title: string; text: string; products: Product[] }[] = [
  {
    id: "new-arrivals", kicker: "Just In", title: "New Arrivals", text: "Freshly crafted designs created for modern celebrations.",
    products: [
      { name: "Peacock Heritage Necklace", material: "925 Silver with 24K Gold Plating", price: "6,499", badge: "New", image: templeNecklace },
      { name: "Antique Ruby Bangles", material: "925 Silver with 24K Gold Plating", price: "3,999", badge: "New", image: bangle2 },
      { name: "Lotus Jhumka Earrings", material: "925 Silver with 24K Gold Plating", price: "1,699", badge: "New", image: earring2 },
    ],
  },
  {
    id: "best-sellers", kicker: "Customer Favourites", title: "Best Sellers", text: "The Annai designs most loved and chosen by our customers.",
    products: [
      { name: "Royal Lakshmi Necklace", material: "925 Silver with 24K Gold Plating", price: "7,499", badge: "Bestseller", image: templeNecklace },
      { name: "Traditional Gold Jhumka", material: "925 Silver with 24K Gold Plating", price: "1,899", badge: "Bestseller", image: earring3 },
      { name: "Antique Bridal Bangles", material: "925 Silver with 24K Gold Plating", price: "4,499", badge: "Bestseller", image: bangle3 },
    ],
  },
  {
    id: "bangles", kicker: "Grace at Your Wrist", title: "Bangles", text: "A complete collection of traditional, bridal and everyday gold-plated silver bangles.",
    products: [
      { name: "Classic Temple Gold Bangle", material: "925 Silver with 24K Gold Plating", price: "2,899", badge: "Bestseller", image: bangle1 },
      { name: "Antique Ruby Bangles", material: "925 Silver with 24K Gold Plating", price: "3,999", badge: "New", image: bangle2 },
      { name: "Antique Bridal Bangles", material: "925 Silver with 24K Gold Plating", price: "4,499", badge: "Bestseller", image: bangle3 },
      { name: "Golden Petal Bangle", material: "925 Silver with 24K Gold Plating", price: "2,199", image: bangle4 },
      { name: "Infinity Gold-Plated Bangle", material: "925 Silver with 24K Gold Plating", price: "1,699", image: bangle6 },
      { name: "Ruby Floral Bangle", material: "925 Silver with 24K Gold Plating", price: "2,799", image: bangle7 },
      { name: "Traditional Engraved Bangle", material: "925 Silver with 24K Gold Plating", price: "2,649", image: bangle8 },
      { name: "Royal Stone Gold Bangle", material: "925 Silver with 24K Gold Plating", price: "3,249", image: bangle9 },
      { name: "Heritage Nakshi Bangle", material: "925 Silver with 24K Gold Plating", price: "3,599", image: bangle10 },
      { name: "Classic Slim Gold Bangle", material: "925 Silver with 24K Gold Plating", price: "1,999", image: bangle11 },
      { name: "Temple Carved Gold Bangle", material: "925 Silver with 24K Gold Plating", price: "2,599", image: bangle12 },
      { name: "Festive Ruby Kada Bangle", material: "925 Silver with 24K Gold Plating", price: "3,349", image: bangle13 },
      { name: "Royal Ruby Kada Bangle", material: "925 Silver with 24K Gold Plating", price: "3,299", badge: "New", image: bangle14 },
      { name: "Lakshmi Heritage Bangle", material: "925 Silver with 24K Gold Plating", price: "3,599", image: bangle15 },
      { name: "Floral Filigree Gold Bangle", material: "925 Silver with 24K Gold Plating", price: "2,899", image: bangle16 },
      { name: "Antique Peacock Kada", material: "925 Silver with 24K Gold Plating", price: "3,499", badge: "Bestseller", image: bangle17 },
      { name: "Classic Textured Gold Bangle", material: "925 Silver with 24K Gold Plating", price: "2,399", image: bangle18 },
      { name: "Emerald Temple Bangle", material: "925 Silver with 24K Gold Plating", price: "3,799", image: bangle19 },
      { name: "Diamond Cut Kada Bangle", material: "925 Silver with 24K Gold Plating", price: "3,149", image: bangle20 },
      { name: "Traditional Mango Bangle", material: "925 Silver with 24K Gold Plating", price: "3,249", image: bangle21 },
      { name: "Delicate Everyday Gold Bangle", material: "925 Silver with 24K Gold Plating", price: "2,199", image: bangle22 },
      { name: "Bridal Nakshi Kada", material: "925 Silver with 24K Gold Plating", price: "4,299", badge: "New", image: bangle23 },
      { name: "Twisted Rope Gold Bangle", material: "925 Silver with 24K Gold Plating", price: "2,749", image: bangle24 },
      { name: "Regal Stone Studded Bangle", material: "925 Silver with 24K Gold Plating", price: "3,999", image: bangle25 },
    ],
  },
  {
    id: "necklaces", kicker: "Signature Silhouettes", title: "Necklaces", text: "From graceful daily wear to magnificent bridal heirlooms.",
    products: [
      { name: "Temple Bridal Necklace", material: "925 Silver with 24K Gold Plating", price: "8,999", badge: "Bestseller", image: necklace1 },
      { name: "Mango Mala Necklace", material: "925 Silver with 24K Gold Plating", price: "7,999", image: necklace2 },
      { name: "Emerald Heritage Choker", material: "925 Silver with 24K Gold Plating", price: "6,999", image: necklace3 },
      { name: "Royal Lakshmi Haaram", material: "925 Silver with 24K Gold Plating", price: "8,499", badge: "New", image: necklace5 },
      { name: "Antique Peacock Necklace", material: "925 Silver with 24K Gold Plating", price: "6,799", image: necklace6 },
      { name: "Ruby Floral Choker", material: "925 Silver with 24K Gold Plating", price: "5,999", image: necklace7 },
      { name: "Traditional Kasu Mala", material: "925 Silver with 24K Gold Plating", price: "7,499", image: necklace8 },
      { name: "Bridal Nakshi Necklace", material: "925 Silver with 24K Gold Plating", price: "9,499", badge: "Bestseller", image: necklace9 },
      { name: "Emerald Mango Mala", material: "925 Silver with 24K Gold Plating", price: "7,299", image: necklace10 },
      { name: "Lotus Temple Necklace", material: "925 Silver with 24K Gold Plating", price: "6,499", image: necklace11 },
      { name: "Delicate Everyday Necklace", material: "925 Silver with 24K Gold Plating", price: "2,399", image: necklace12 },
      { name: "Regal Kemp Stone Necklace", material: "925 Silver with 24K Gold Plating", price: "7,899", image: necklace13 },
      { name: "Classic Gold-Plated Choker", material: "925 Silver with 24K Gold Plating", price: "4,999", image: necklace14 },
      { name: "Goddess Lakshmi Necklace", material: "925 Silver with 24K Gold Plating", price: "8,299", badge: "New", image: necklace15 },
      { name: "Pearl Drop Heritage Necklace", material: "925 Silver with 24K Gold Plating", price: "5,799", image: necklace16 },
      { name: "Antique Ruby Bridal Haaram", material: "925 Silver with 24K Gold Plating", price: "9,199", image: necklace17 },
      { name: "Peacock Kemp Choker", material: "925 Silver with 24K Gold Plating", price: "6,299", image: necklace18 },
      { name: "Traditional Coin Necklace", material: "925 Silver with 24K Gold Plating", price: "7,699", image: necklace19 },
      { name: "Floral Zircon Necklace", material: "925 Silver with 24K Gold Plating", price: "4,799", image: necklace20 },
      { name: "Grand Temple Long Haaram", material: "925 Silver with 24K Gold Plating", price: "9,999", badge: "Bestseller", image: necklace21 },
      { name: "Ruby Emerald Festive Necklace", material: "925 Silver with 24K Gold Plating", price: "6,899", image: necklace22 },
      { name: "Elegant Pearl Layer Necklace", material: "925 Silver with 24K Gold Plating", price: "5,499", image: necklace23 },
      { name: "Signature Annai Bridal Necklace", material: "925 Silver with 24K Gold Plating", price: "10,499", badge: "New", image: necklace24 },
    ],
  },
  {
    id: "earrings", kicker: "Frame Your Glow", title: "Gold-Plated Silver Earrings", text: "925 silver earrings finished with radiant 24K gold plating for a traditional look at an accessible price.",
    products: [
      { name: "Lakshmi Temple Jhumka", material: "925 Silver with 24K Gold Plating", price: "1,799", image: earring1 },
      { name: "Lotus Jhumka Earrings", material: "925 Silver with 24K Gold Plating", price: "1,699", badge: "New", image: earring2 },
      { name: "Traditional Gold Jhumka", material: "925 Silver with 24K Gold Plating", price: "1,899", badge: "Bestseller", image: earring3 },
      { name: "Floral Gold-Plated Studs", material: "925 Silver with 24K Gold Plating", price: "1,299", image: earring4 },
      { name: "Emerald Gold-Plated Drops", material: "925 Silver with 24K Gold Plating", price: "2,199", image: earring5 },
      { name: "Pearl Gold-Plated Drops", material: "925 Silver with 24K Gold Plating", price: "1,599", image: earring6 },
      { name: "Antique Floral Jhumka", material: "925 Silver with 24K Gold Plating", price: "1,999", image: earring7 },
      { name: "Royal Ruby Drop Earrings", material: "925 Silver with 24K Gold Plating", price: "2,299", image: earring8 },
      { name: "Golden Peacock Earrings", material: "925 Silver with 24K Gold Plating", price: "2,149", image: earring9 },
      { name: "Classic Gold-Plated Studs", material: "925 Silver with 24K Gold Plating", price: "1,249", image: earring10 },
      { name: "Heritage Bridal Jhumka", material: "925 Silver with 24K Gold Plating", price: "2,499", image: earring11 },
    ],
  },
  {
    id: "chains", kicker: "Everyday Elegance", title: "Gold-Plated Silver Chains", text: "Refined 925 silver chains finished with radiant 24K gold plating for effortless everyday styling.",
    products: [
      { name: "Classic Rope Gold Chain", material: "925 Silver with 24K Gold Plating", price: "2,299", badge: "New", image: chain1 },
      { name: "Singapore Twist Chain", material: "925 Silver with 24K Gold Plating", price: "2,499", image: chain2 },
      { name: "Box Link Gold Chain", material: "925 Silver with 24K Gold Plating", price: "2,699", image: chain3 },
      { name: "Figaro Gold-Plated Chain", material: "925 Silver with 24K Gold Plating", price: "2,799", badge: "Bestseller", image: chain4 },
      { name: "Delicate Cable Chain", material: "925 Silver with 24K Gold Plating", price: "1,899", image: chain5 },
      { name: "Royal Curb Link Chain", material: "925 Silver with 24K Gold Plating", price: "3,199", image: chain6 },
      { name: "Wheat Weave Gold Chain", material: "925 Silver with 24K Gold Plating", price: "2,999", image: chain7 },
      { name: "Snake Pattern Gold Chain", material: "925 Silver with 24K Gold Plating", price: "2,599", image: chain8 },
      { name: "Heritage Link Chain", material: "925 Silver with 24K Gold Plating", price: "3,499", image: chain9 },
      { name: "Twisted Franco Chain", material: "925 Silver with 24K Gold Plating", price: "3,299", image: chain10 },
      { name: "Fine Venetian Chain", material: "925 Silver with 24K Gold Plating", price: "2,199", image: chain11 },
      { name: "Statement Gold Link Chain", material: "925 Silver with 24K Gold Plating", price: "3,699", badge: "New", image: chain12 },
      { name: "Radiant Serpentine Chain", material: "925 Silver with 24K Gold Plating", price: "2,749", image: chain13 },
      { name: "Diamond Cut Cable Chain", material: "925 Silver with 24K Gold Plating", price: "2,399", image: chain14 },
      { name: "Imperial Box Link Chain", material: "925 Silver with 24K Gold Plating", price: "3,299", badge: "Bestseller", image: chain15 },
      { name: "Slim Herringbone Chain", material: "925 Silver with 24K Gold Plating", price: "2,899", image: chain16 },
      { name: "Traditional Ball Link Chain", material: "925 Silver with 24K Gold Plating", price: "2,549", image: chain17 },
      { name: "Double Twist Gold Chain", material: "925 Silver with 24K Gold Plating", price: "3,149", image: chain18 },
      { name: "Classic Anchor Link Chain", material: "925 Silver with 24K Gold Plating", price: "2,999", image: chain19 },
      { name: "Royal Byzantine Chain", material: "925 Silver with 24K Gold Plating", price: "3,899", badge: "New", image: chain20 },
      { name: "Fine Rolo Gold Chain", material: "925 Silver with 24K Gold Plating", price: "2,249", image: chain21 },
      { name: "Textured Curb Gold Chain", material: "925 Silver with 24K Gold Plating", price: "3,449", image: chain22 },
      { name: "Elegant Omega Gold Chain", material: "925 Silver with 24K Gold Plating", price: "3,749", image: chain23 },
      { name: "Heritage Wheat Link Chain", material: "925 Silver with 24K Gold Plating", price: "3,599", image: chain24 },
    ],
  },
  {
    id: "chain-bracelets", kicker: "Effortless Everyday Style", title: "Gold-Plated Silver Chain Bracelets", text: "Versatile 925 silver links finished with luminous 24K gold plating.",
    products: [
      { name: "Classic Rope Chain Bracelet", material: "925 Silver with 24K Gold Plating", price: "1,899", image: bangle8 },
      { name: "Curb Link Gold-Plated Bracelet", material: "925 Silver with 24K Gold Plating", price: "2,299", image: bangle9 },
      { name: "Figaro Chain Bracelet", material: "925 Silver with 24K Gold Plating", price: "1,799", image: bangle10 },
      { name: "Zircon Link Bracelet", material: "925 Silver with 24K Gold Plating", price: "2,999", image: bangle11 },
      { name: "Twisted Gold Chain Bracelet", material: "925 Silver with 24K Gold Plating", price: "2,499", image: bangle13 },
    ],
  },
];

const ProductShelf = ({ shelf, alternate, onQuickView, onAddToCart }: { shelf: typeof productShelves[number]; alternate: boolean; onQuickView: (product: Product) => void; onAddToCart: (product: Product) => void }) => (
  <section id={shelf.id} className={`product-shelf px-4 py-16 sm:px-6 lg:px-10 ${alternate ? "bg-[#fbf8f1]" : "bg-white"}`}>
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">{shelf.kicker}</p><h2 className="mt-2 text-3xl font-medium text-slate-900 sm:text-4xl">{shelf.title}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{shelf.text}</p></div>
        <Link to={`/collection/${shelf.id}`} className="inline-flex items-center gap-2 border-b border-amber-500 pb-1 text-sm font-medium text-amber-700">View all <ArrowRight className="h-4 w-4"/></Link>
      </div>
      <div className="product-shelf-grid grid gap-4 overflow-x-auto pb-4">
        {shelf.products.map((product, index) => <Reveal key={product.name} delay={index * 60}><article className="group overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div className="relative h-72 overflow-hidden bg-[#f8f2e8]"><Link to={`/product/${productSlug(product.name)}`} className="block h-full w-full overflow-hidden"><img src={product.image} alt={product.name} className="h-full w-full object-contain transition duration-700 group-hover:scale-110"/></Link>{product.badge && <span className="absolute left-3 top-3 rounded-full bg-[#D4AF37] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white">{product.badge}</span>}<button type="button" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-amber-700 shadow-sm" aria-label={`Save ${product.name}`}><Heart className="h-4 w-4"/></button><button type="button" onClick={() => onQuickView(product)} className="quick-view-button absolute right-3 top-14 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-amber-700 shadow-sm" aria-label={`Quick view ${product.name}`} title="Quick view"><Eye className="h-4 w-4"/></button></div>
          <div className="p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-600">{product.material}</p><h3 className="mt-2 text-lg font-medium text-slate-900">{product.name}</h3><div className="mt-4 flex items-center justify-between"><strong className="text-sm text-slate-900"><Price value={product.price}/></strong><button type="button" onClick={()=>onAddToCart(product)} className="grid h-9 w-9 place-items-center rounded-full bg-amber-600 text-white transition hover:bg-amber-700" aria-label={`Add ${product.name} to bag`}><ShoppingBag className="h-4 w-4"/></button></div></div>
        </article></Reveal>)}
      </div>
    </div>
  </section>
);

const reviewNames = [
  "Priya S.", "Meena R.", "Kavya M.", "Anitha K.", "Lakshmi P.", "Divya R.", "Nithya S.", "Aarthi M.", "Revathi K.",
  "Janani V.", "Deepa N.", "Sangeetha R.", "Harini P.", "Keerthana S.", "Vijaya M.", "Shalini R.", "Gayathri K.", "Sowmya P.",
];
const reviewStories = [
  "The bridal necklace was even more beautiful than I imagined. The team guided us patiently and explained every detail clearly.",
  "Excellent craftsmanship, transparent pricing and truly warm service. Annai is now our family jeweller.",
  "I loved the contemporary designs and the finishing. My earrings arrived beautifully packed and right on time.",
  "We found the perfect wedding set within our budget. The silver quality and gold-plating care were explained with complete honesty.",
  "Beautiful temple jewellery and such a welcoming team. My entire family enjoyed the shopping experience.",
  "The silver collection is elegant and reasonably priced. I have already recommended Annai to my friends.",
  "My bangles were customised perfectly and delivered as promised. The workmanship is exceptional.",
  "A wonderful selection of traditional and modern jewellery. The staff never rushed us and helped us choose confidently.",
  "The exchange process was simple and transparent. I am very happy with my new necklace.",
  "My anniversary necklace is delicate, elegant and beautifully finished. Thank you for making the day extra special.",
  "The bridal consultation was personal and thoughtful. Every piece complemented my wedding saree beautifully.",
  "Trusted quality, kind service and gorgeous designs. We have been shopping with Annai for many years.",
];
const initialReviews = Array.from({ length: 54 }, (_, index) => ({
  name: reviewNames[index % reviewNames.length],
  rating: index % 13 === 0 ? 4 : 5,
  text: reviewStories[index % reviewStories.length],
}));

export default function HomePage() {
  const allProducts = productShelves.flatMap((shelf) => shelf.products);
  const heroSlides = [
    {
      image: heroImage,
      kicker: "The Wedding Edit - 2026",
      title: "Jewellery for Today.",
      accent: "Heirlooms for Tomorrow.",
      text: "Discover handcrafted 925 silver jewellery with radiant 24K gold plating, rooted in South Indian tradition.",
      position: "center",
    },
    {
      image: templeNecklace,
      kicker: "Timeless Temple Jewellery",
      title: "Crafted by Hand.",
      accent: "Cherished for Generations.",
      text: "Intricate heritage motifs, quality-checked silver and careful 24K gold plating come together in every Annai creation.",
      position: "center 43%",
    },
  ];
  const [activeSlide, setActiveSlide] = useState(0);
  const [quickViewIndex, setQuickViewIndex] = useState<number | null>(null);
  const [quickQuantity, setQuickQuantity] = useState(1);
  const [quickImage, setQuickImage] = useState(0);
  const [cartNotice, setCartNotice] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [customerReviews, setCustomerReviews] = useState(initialReviews);

  useEffect(() => {
    if (!reviewModalOpen && quickViewIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [reviewModalOpen, quickViewIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % heroSlides.length), 5500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const changeSlide = (direction: number) =>
    setActiveSlide((current) => (current + direction + heroSlides.length) % heroSlides.length);

  const openQuickView = (product: Product) => {
    setQuickViewIndex(allProducts.findIndex((item) => item.name === product.name));
    setQuickQuantity(1);
    setQuickImage(0);
    setCartNotice("");
  };
  const moveQuickView = (direction: number) => {
    setQuickViewIndex((current) => current === null ? 0 : (current + direction + allProducts.length) % allProducts.length);
    setQuickQuantity(1);
    setQuickImage(0);
    setCartNotice("");
  };
  const addJewelleryToCart = (product: Product, quantity: number) => {
    const key = `jewel-${productSlug(product.name)}`;
    const cart = readCart();
    writeCart({ ...cart, [key]: Number(cart[key] || 0) + quantity });
    localStorage.setItem("annai_cart_products", JSON.stringify({ ...JSON.parse(localStorage.getItem("annai_cart_products") || "{}"), [key]: product }));
    setCartNotice(`${quantity} item${quantity > 1 ? "s" : ""} added to your cart.`);
  };

  const submitReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = reviewName.trim();
    const text = reviewText.trim();
    if (name.length < 2 || text.length < 10) {
      setReviewMessage("Please enter your name and a review of at least 10 characters.");
      return;
    }
    setCustomerReviews((reviews) => [{ name, rating: reviewRating, text }, ...reviews]);
    setReviewName("");
    setReviewText("");
    setReviewRating(5);
    setReviewMessage("Thank you! Your review has been added.");
  };

  return <>
    <SEO title="Annai Jewellery" description="Shop 925 silver ornaments with 24K gold plating, including earrings, necklaces, bangles, chains and bridal jewellery." />

    <section className="jewellery-hero-slider relative min-h-[620px] w-full overflow-hidden text-amber-900 sm:min-h-[680px]">
      {heroSlides.map((slide, index) => (
        <div key={slide.title} className={`jewellery-hero-slide absolute inset-0 ${index === activeSlide ? "is-active" : ""}`}>
          <img src={slide.image} alt={`${slide.title} ${slide.accent}`} data-eager={index === 0 ? "true" : undefined} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" style={{ objectPosition: slide.position }} className="h-full w-full object-cover" />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/10" />
      <div className="relative z-10 mx-auto flex min-h-[620px] max-w-7xl items-center px-6 py-24 sm:min-h-[680px] sm:px-10 lg:px-12">
        <div key={activeSlide} className="jewellery-hero-content max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 shadow-sm backdrop-blur"><Gem className="h-4 w-4" /> {heroSlides[activeSlide].kicker}</p>
          <h1 className="text-4xl font-medium leading-[1.08] text-slate-900 sm:text-5xl lg:text-6xl">{heroSlides[activeSlide].title}<br/><span className="text-amber-600">{heroSlides[activeSlide].accent}</span></h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-slate-700 sm:text-base">{heroSlides[activeSlide].text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#collections" className="hero-primary-cta inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-medium text-white"><Sparkles className="h-4 w-4"/> Explore Collections</a>
            <Link to="/booking" className="hero-secondary-cta inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"><CalendarCheck className="h-4 w-4"/> Book a Visit</Link>
            <a href="tel:+911234567890" className="hero-secondary-cta inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"><Phone className="h-4 w-4"/> Call Now</a>
          </div>
          <div className="mt-7 flex flex-wrap gap-5 text-sm text-slate-700"><span><strong className="font-medium text-amber-700">Certified 925 Silver</strong> Base</span><span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-500 text-amber-500"/> 4.9 Customer Rating</span><span className="flex items-center gap-1"><Award className="h-4 w-4 text-amber-600"/> 24K Gold-Plated Finish</span></div>
        </div>
      </div>
      <button type="button" onClick={() => changeSlide(-1)} className="absolute left-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-amber-200 bg-white/85 text-amber-700 shadow-lg backdrop-blur transition hover:bg-amber-600 hover:text-white sm:left-6" aria-label="Previous banner"><ArrowLeft className="h-5 w-5"/></button>
      <button type="button" onClick={() => changeSlide(1)} className="absolute right-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-amber-200 bg-white/85 text-amber-700 shadow-lg backdrop-blur transition hover:bg-amber-600 hover:text-white sm:right-6" aria-label="Next banner"><ArrowRight className="h-5 w-5"/></button>
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {heroSlides.map((slide, index) => <button key={slide.title} type="button" onClick={() => setActiveSlide(index)} className={`h-2.5 rounded-full bg-amber-600 transition-all ${index === activeSlide ? "w-9" : "w-2.5 opacity-45"}`} aria-label={`Show banner ${index + 1}`}/>)}
      </div>
    </section>

    <section id="collections" className="shop-category-section relative overflow-hidden bg-white px-4 py-14 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Find your favourite</p>
          <h2 className="mt-2 text-3xl font-medium uppercase tracking-[0.08em] text-[#5a4323] sm:text-4xl">Shop by Category</h2>
          <span className="mx-auto mt-4 block h-px w-28 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        </div>
        <div className="shop-category-grid grid gap-2 sm:gap-3 lg:gap-4">
          {collections.map((item,index)=><Reveal key={item.title} delay={index*70} className="h-full">
            <Link to={`/collection/${item.title.toLowerCase()}`} className="shop-category-card group flex h-full flex-col overflow-hidden rounded-2xl border border-amber-100 bg-[#fbf8f1] text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl">
              <div className="shop-category-image overflow-hidden"><img src={item.image} alt={`${item.title} collection`} className="h-full w-full object-contain transition duration-700 group-hover:scale-105"/></div>
              <div className="bg-white px-2 py-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-slate-900 sm:text-base">{item.title}</h3>
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-slate-500 transition group-hover:text-amber-700 sm:text-xs">Explore <ArrowRight className="h-3 w-3"/></span>
              </div>
            </Link>
          </Reveal>)}
        </div>
      </div>
    </section>

    {productShelves.map((shelf, index) => <ProductShelf key={shelf.id} shelf={shelf} alternate={index % 2 === 1} onQuickView={openQuickView} onAddToCart={(product)=>addJewelleryToCart(product,1)} />)}

    {/* <section className="px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionTitle kicker="The Annai Promise" title="Genuine silver. Radiant gold finish." text="Every piece combines a quality-checked 925 silver base with carefully applied 24K gold plating."/>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Reveal><div className="group relative min-h-[430px] overflow-hidden rounded-3xl border border-slate-100 bg-amber-700 shadow-sm"><img src={templeNecklace} alt="Traditional Annai temple necklace" className="h-full min-h-[430px] w-full object-contain"/><div className="absolute inset-0 bg-gradient-to-t from-amber-900/70 via-transparent to-transparent"/><div className="absolute bottom-0 p-7 text-white"><p className="text-sm uppercase tracking-[.25em]">Crafted by hand</p><h2 className="mt-2 text-3xl font-medium">Tradition, refined for you</h2></div></div></Reveal>
          <div className="grid gap-4">{promises.map(([Icon,title,text],i)=><Reveal key={title} delay={i*80}><Card className="group h-full p-5"><div className="flex gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Icon className="h-6 w-6"/></span><div><h3 className="text-lg font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div></div></Card></Reveal>)}</div>
        </div>
      </div>
    </section> */}

    {/* <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl text-center"><SectionTitle kicker="A Legacy of Trust" title="Jewellery made for life's precious moments." text="From first gifts to wedding heirlooms, Annai is honoured to be part of your story."/>
        <div className="grid gap-4 sm:grid-cols-3">{[["925","Sterling silver base"],["24K","Gold-plated finish"],["100%","Quality checked"]].map(([n,l])=><Card key={l} className="p-8"><strong className="text-4xl text-amber-600">{n}</strong><p className="mt-2 text-sm text-slate-600">{l}</p></Card>)}</div>
      </div>
    </section> */}

    {/* <section className="px-4 py-16 sm:px-6 lg:px-10"><div className="mx-auto max-w-5xl rounded-3xl bg-amber-700 p-8 text-center text-white sm:p-12"><MessageCircle className="mx-auto h-8 w-8 text-amber-500"/><h2 className="mt-4 text-3xl font-medium">Let us help you find the perfect jewel.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">Book a private consultation or speak with our jewellery experts on WhatsApp.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/booking" className="rounded-full bg-amber-600 px-7 py-3 text-sm font-medium">Book an Appointment</Link><a href="https://wa.me/911234567890" className="rounded-full border border-white/30 px-7 py-3 text-sm font-medium">Chat on WhatsApp</a></div></div></section>
    <section className="px-4 pb-20 sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl"><SectionTitle kicker="Shop With Confidence" title="The Annai experience." text="Thoughtful service before, during and long after your purchase."/><div className="grid gap-4 sm:grid-cols-3"><Card className="p-6"><Truck className="text-amber-600"/><h3 className="mt-4 text-lg font-medium">Insured Delivery</h3><p className="mt-2 text-sm text-slate-600">Safe shipping with careful, secure packaging.</p></Card><Card className="p-6"><ShieldCheck className="text-amber-600"/><h3 className="mt-4 text-lg font-medium">Transparent Materials</h3><p className="mt-2 text-sm text-slate-600">Clear 925 silver, 24K gold-plating and care details.</p></Card><Card className="p-6"><Heart className="text-amber-600"/><h3 className="mt-4 text-lg font-medium">Dedicated Care</h3><p className="mt-2 text-sm text-slate-600">Helpful guidance for cleaning, storage and preserving the plated finish.</p></Card></div></div></section> */}

    <section className="customer-reviews-section bg-[#fbf8f1] px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <SectionTitle kicker="50+ Customer Reviews" title="Stories shared by the Annai family." text="Read genuine experiences or tell us about the jewellery and service you received." />
          <button type="button" onClick={()=>{setReviewModalOpen(true);setReviewMessage("");}} className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-700"><Star className="h-4 w-4"/>Add Review</button>
        </div>
        <div>
          <div className="review-marquee">
            <div className="review-marquee-track">
              {[...customerReviews, ...customerReviews].map((review, index) => (
                <article key={`${review.name}-${index}`} className="review-moving-card rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex text-amber-500">{Array.from({ length: 5 }).map((_, star) => <Star key={star} className={`h-4 w-4 ${star < review.rating ? "fill-current" : "opacity-25"}`}/>)}</div>
                  <blockquote className="text-sm leading-7 text-slate-600">&ldquo;{review.text}&rdquo;</blockquote>
                  <div className="mt-5 flex items-center gap-3 border-t border-amber-100 pt-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 font-semibold text-amber-700">{review.name.charAt(0).toUpperCase()}</span><div><strong className="block text-sm text-slate-900">{review.name}</strong><span className="text-xs text-slate-500">Verified customer</span></div></div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {reviewModalOpen&&<div className="review-modal-backdrop fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-amber-800/55 p-4 pb-20 backdrop-blur-sm lg:pb-4" role="dialog" aria-modal="true" aria-label="Add customer review" onClick={()=>setReviewModalOpen(false)}>
      <form onSubmit={submitReview} onClick={(event)=>event.stopPropagation()} className="review-modal-card relative my-auto max-h-[calc(100dvh-110px)] w-full max-w-md overflow-y-auto rounded-3xl border border-amber-200 bg-white p-5 shadow-2xl sm:max-h-[90vh] sm:p-7">
        <button type="button" onClick={()=>setReviewModalOpen(false)} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[#fbf8f1] text-slate-900" aria-label="Close review form"><X className="h-4 w-4"/></button>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Share Your Experience</p>
        <h3 className="mt-2 text-2xl font-medium text-slate-900">Add a review</h3>
        <label className="mt-6 block text-xs font-semibold text-slate-700">Your rating</label>
        <div className="mt-2 flex gap-1">{Array.from({length:5}).map((_,index)=><button key={index} type="button" onClick={()=>setReviewRating(index+1)} aria-label={`${index+1} stars`} className="text-amber-500"><Star className={`h-7 w-7 ${index<reviewRating?"fill-current":"opacity-25"}`}/></button>)}</div>
        <label className="mt-5 block text-xs font-semibold text-slate-700" htmlFor="review-name">Your name</label>
        <input id="review-name" value={reviewName} onChange={(event)=>setReviewName(event.target.value)} maxLength={60} placeholder="Enter your name" className="mt-2 w-full rounded-2xl border border-amber-100 bg-[#fdfaf4] px-4 py-3 text-sm outline-none"/>
        <label className="mt-5 block text-xs font-semibold text-slate-700" htmlFor="review-text">Your review</label>
        <textarea id="review-text" value={reviewText} onChange={(event)=>setReviewText(event.target.value)} maxLength={600} placeholder="Tell us about your Annai experience..." className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-amber-100 bg-[#fdfaf4] px-4 py-3 text-sm outline-none"/>
        {reviewMessage&&<p className={`mt-3 text-xs ${reviewMessage.startsWith("Thank")?"text-green-700":"text-amber-700"}`}>{reviewMessage}</p>}
        <button type="submit" className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-amber-700"><Send className="h-4 w-4"/>Submit Review</button>
      </form>
    </div>}

    {quickViewIndex !== null && (() => {
      const product = allProducts[quickViewIndex];
      const gallery = [product.image, ...allProducts.filter((item) => item.name !== product.name).slice(0, 2).map((item) => item.image)];
      const numericPrice = Number(product.price.replace(/[^\d]/g, "")) || 0;
      return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-amber-800/65 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Quick view ${product.name}`}>
        <div className="quick-view-modal-scroll relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-amber-200 bg-white shadow-2xl">
          <button type="button" onClick={() => setQuickViewIndex(null)} className="absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-900 shadow-lg" aria-label="Close quick view"><X className="h-5 w-5"/></button>
          <button type="button" onClick={() => moveQuickView(-1)} className="absolute left-3 top-1/3 z-30 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-amber-700 shadow-lg" aria-label="Previous product"><ArrowLeft className="h-5 w-5"/></button>
          <button type="button" onClick={() => moveQuickView(1)} className="absolute right-3 top-1/3 z-30 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-amber-700 shadow-lg" aria-label="Next product"><ArrowRight className="h-5 w-5"/></button>
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-[#fbf8f1] p-5 sm:p-8">
              <ZoomableProductImage src={gallery[quickImage]} alt={product.name} className="h-[360px] rounded-2xl bg-white sm:h-[520px]" />
              <div className="mt-4 grid grid-cols-3 gap-3">{gallery.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setQuickImage(index)} className={`h-24 overflow-hidden rounded-xl border-2 bg-white ${quickImage === index ? "border-amber-500" : "border-transparent"}`}><img src={image} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-contain"/></button>)}</div>
            </div>
            <div className="p-6 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">{product.material}</p>
              <h2 className="mt-3 pr-10 text-3xl font-medium text-slate-900">{product.name}</h2>
              <div className="mt-3 flex items-center gap-2 text-sm"><div className="flex text-amber-500">{[0,1,2,3,4].map((star) => <Star key={star} className="h-4 w-4 fill-current"/>)}</div><span className="text-slate-500">12 reviews</span></div>
              <p className="mt-5 text-2xl font-semibold text-slate-900"><Price value={product.price}/></p><p className="mt-1 text-xs text-slate-500">3% GST will be added at checkout</p>
              <div className="mt-5 space-y-2 rounded-2xl bg-[#fbf8f1] p-4 text-sm"><p><strong>3 sold</strong> in the last 20 hours</p><p>Vendor: <span className="text-amber-700">Annai Jewellery</span></p><p>Availability: <strong className="text-green-700">In Stock</strong></p><p>Product type: Jewellery</p><p className="font-semibold text-amber-700">Hurry! Only 8 pieces left.</p></div>
              <div className="mt-5"><p className="text-sm font-semibold">Finish: <span className="text-slate-500">24K Gold Plated</span></p></div>
              <div className="mt-5 flex items-center justify-between border-y border-amber-100 py-4"><div><p className="text-xs text-slate-500">Subtotal</p><strong className="text-lg"><Price value={numericPrice * quickQuantity}/></strong></div><div className="flex items-center rounded-full border border-amber-200"><button type="button" onClick={()=>setQuickQuantity((q)=>Math.max(1,q-1))} className="grid h-10 w-10 place-items-center" aria-label="Decrease quantity"><Minus className="h-4 w-4"/></button><span className="w-9 text-center text-sm font-semibold">{quickQuantity}</span><button type="button" onClick={()=>setQuickQuantity((q)=>Math.min(8,q+1))} className="grid h-10 w-10 place-items-center" aria-label="Increase quantity"><Plus className="h-4 w-4"/></button></div></div>
              <button type="button" onClick={()=>addJewelleryToCart(product,quickQuantity)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-amber-700"><ShoppingBag className="h-4 w-4"/> Add to cart</button>
              <div className="mt-3 grid grid-cols-2 gap-3"><button type="button" className="rounded-full border border-amber-300 px-4 py-3 text-sm font-semibold text-amber-700"><Heart className="mr-2 inline h-4 w-4"/>Wishlist</button><Link to={`/product/${productSlug(product.name)}`} className="rounded-full bg-[#D4AF37] px-4 py-3 text-center text-sm font-semibold text-white">View full details</Link></div>
              {cartNotice && <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-700">{cartNotice}</p>}
              <p className="mt-5 text-center text-xs text-slate-500"><Eye className="mr-1 inline h-4 w-4"/>283 customers are viewing this product</p>
            </div>
          </div>
        </div>
      </div>;
    })()}
  </>;
}
