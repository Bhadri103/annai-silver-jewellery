import React from "react";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Clock3, Send } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import logoDark from "../assets/logo-dark-theme.png";

const showroomDirections = "https://www.google.com/maps/dir//Annai+Sliver+Jewellery,+Shop+No+8,+Old+Bus+Stand,+Padmanabhapuram,+Tamil+Nadu+629175/@8.2073794,77.3040963,1915m/data=!3m1!1e3!4m8!4m7!1m0!1m5!1m1!1s0x3b04f9c3ad0b657f:0x9c9047a12495cad7!2m2!1d77.3202801!2d8.2407514?entry=ttu&g_ep=EgoyMDI2MDcyMi4wIKXMDSoASAFQAw%3D%3D";
const showroomEmbed = "https://www.google.com/maps?q=Annai%20Sliver%20Jewellery%2C%20Shop%20No%208%2C%20Old%20Bus%20Stand%2C%20Padmanabhapuram%2C%20Tamil%20Nadu%20629175&output=embed";

const shopLinks = [
  ["New Arrivals", "/collection/new-arrivals"],
  ["Best Sellers", "/collection/best-sellers"],
  ["Necklaces", "/collection/necklaces"],
  ["Earrings", "/collection/earrings"],
  ["Bracelets", "/collection/bracelets"],
  ["Chains", "/collection/chains"],
  ["Chain Bracelets", "/collection/chain-bracelets"],
  ["Rings", "/collection/rings"],
];

const customerLinks = [
  ["About Annai", "/about"],
  ["Contact Us", "/contact"],
  ["My Account", "/profile"],
  ["Wishlist", "/wishlist"],
  ["Shopping Cart", "/cart"],
  ["All Jewellery", "/collection/indian-jewellery"],
];

const Footer: React.FC = () => (
  <footer className="site-footer border-t border-amber-100 bg-[#fbf8f1] text-slate-900">
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.8fr_0.8fr_1.25fr]">
        <div>
          <Link to="/" className="inline-flex items-center">
            <img src={logo} alt="Annai Jewellery" className="theme-logo-light h-16 w-auto object-contain" loading="lazy" decoding="async"/>
            <img src={logoDark} alt="Annai Jewellery" className="theme-logo-dark h-16 w-auto object-contain" loading="lazy" decoding="async"/>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">Quality-checked 925 silver ornaments finished with radiant 24K gold plating and shaped by South Indian tradition.</p>
          <div className="mt-6 flex gap-3">
            {[
              [Instagram, "https://www.instagram.com/", "Instagram"],
              [Facebook, "https://www.facebook.com/", "Facebook"],
              [MessageCircle, "https://wa.me/919751229418", "WhatsApp"],
            ].map(([Icon, href, label]) => (
              <a key={label as string} href={href as string} target="_blank" rel="noreferrer" aria-label={label as string} className="grid h-10 w-10 place-items-center rounded-full border border-amber-200 bg-white text-amber-700 transition hover:-translate-y-1 hover:bg-amber-600 hover:text-white">
                <Icon className="h-4 w-4"/>
              </a>
            ))}
          </div>
          <div className="mt-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Jewellery updates</p>
            <div className="mt-3 flex max-w-sm overflow-hidden rounded-full border border-amber-200 bg-white">
              <input type="email" aria-label="Email for jewellery updates" placeholder="Enter your email" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-xs outline-none"/>
              <button type="button" aria-label="Subscribe" className="grid w-12 place-items-center bg-amber-600 text-white transition hover:bg-amber-700"><Send className="h-4 w-4"/></button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Shop</h3>
          <ul className="mt-5 space-y-3 text-sm text-slate-600">
            {shopLinks.map(([label, href]) => <li key={label}><Link to={href} className="transition hover:text-amber-600">{label}</Link></li>)}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Customer Care</h3>
          <ul className="mt-5 space-y-3 text-sm text-slate-600">
            {customerLinks.map(([label, href]) => <li key={label}><Link to={href} className="transition hover:text-amber-600">{label}</Link></li>)}
          </ul>
          <div className="mt-7 space-y-3 border-t border-amber-100 pt-6 text-xs leading-6 text-slate-600">
            <p className="flex gap-3"><Phone className="mt-1 h-4 w-4 shrink-0 text-amber-600"/>+91 97512 29418</p>
            <p className="flex gap-3"><Mail className="mt-1 h-4 w-4 shrink-0 text-amber-600"/>info@annaijewellery.com</p>
            <p className="flex gap-3"><Clock3 className="mt-1 h-4 w-4 shrink-0 text-amber-600"/>Monday-Saturday: 9 AM-9 PM<br/>Sunday: Closed</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Visit Our Showroom</h3>
          <a href={showroomDirections} target="_blank" rel="noreferrer" className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-600 transition hover:text-amber-600">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-amber-600"/>Shop No 8, Old Bus Stand, Padmanabhapuram, Tamil Nadu 629175
          </a>
          <div className="mt-4 h-56 overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
            <iframe title="Annai Jewellery showroom map" src={showroomEmbed} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
          </div>
        </div>
      </div>
    </div>

    <div className="border-t border-amber-100 bg-white/70 px-4 py-5">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
        <p>&copy; {new Date().getFullYear()} Annai Jewellery. All rights reserved.</p>
        <div className="flex flex-wrap justify-center gap-5"><span>925 Silver Base</span><span>24K Gold Plated</span><span>Secure Payments</span><span>Insured Shipping</span></div>
      </div>
    </div>
  </footer>
);

export default Footer;
