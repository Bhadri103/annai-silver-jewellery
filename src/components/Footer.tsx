import React from "react";
import { Instagram, MapPin, MessageCircle, Phone, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const showroomDirections = "https://www.google.com/maps/dir//Annai+Sliver+Jewellery,+Shop+No+8,+Old+Bus+Stand,+Thucklay,+Tamil+Nadu+629175/@8.2073794,77.3040963,1915m/data=!3m1!1e3!4m8!4m7!1m0!1m5!1m1!1s0x3b04f9c3ad0b657f:0x9c9047a12495cad7!2m2!1d77.3202801!2d8.2407514?entry=ttu&g_ep=EgoyMDI2MDcyMi4wIKXMDSoASAFQAw%3D%3D";

const shopLinks = [
  ["New Arrivals", "/collection/new-arrivals"],
  ["Best Sellers", "/collection/best-sellers"],
  ["Bangles", "/collection/bangles"],
  ["All Jewellery", "/collection/products"],
];

const customerLinks = [
  ["My Account", "/profile"],
  ["Wishlist", "/wishlist"],
];

const Footer: React.FC = () => (
  <footer className="site-footer border-t border-amber-200 bg-[#faf6eb] text-slate-900">
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_0.9fr_1.15fr] lg:gap-14">
        <div>
          <Link to="/" className="inline-flex">
            <img src={logo} alt="Annai Jewellery" className="h-20 w-auto object-contain" loading="lazy" decoding="async"/>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">Timeless silver jewellery, made with care.</p>
          <div className="mt-5 flex gap-3">
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-amber-300 bg-white text-amber-700 transition hover:-translate-y-0.5 hover:bg-amber-600 hover:text-white"><Instagram className="h-4 w-4"/></a>
            <a href="https://wa.me/919751229418" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-full border border-amber-300 bg-white text-amber-700 transition hover:-translate-y-0.5 hover:bg-amber-600 hover:text-white"><MessageCircle className="h-4 w-4"/></a>
            <a href="tel:+919751229418" aria-label="Call Annai Jewellery" className="grid h-10 w-10 place-items-center rounded-full border border-amber-300 bg-white text-amber-700 transition hover:-translate-y-0.5 hover:bg-amber-600 hover:text-white"><Phone className="h-4 w-4"/></a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-7">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Shop</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {shopLinks.map(([label, href]) => <li key={label}><Link to={href} className="transition hover:text-amber-600">{label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Help</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {customerLinks.map(([label, href]) => <li key={label}><Link to={href} className="transition hover:text-amber-600">{label}</Link></li>)}
            </ul>
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Visit Annai</h3>
          <a href={showroomDirections} target="_blank" rel="noreferrer" className="mt-5 flex max-w-sm items-start gap-3 text-sm leading-6 text-slate-600 transition hover:text-amber-600">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-amber-600"/>Shop No. 8, Old Bus Stand, Thucklay, Tamil Nadu 629175
          </a>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <a href="tel:+919751229418" className="flex items-center gap-3 transition hover:text-amber-600"><Phone className="h-4 w-4 text-amber-600"/>+91 97512 29418</a>
            <p className="flex items-start gap-3"><Clock3 className="mt-0.5 h-4 w-4 text-amber-600"/><span>Mon-Sat, 9 AM-9 PM<br/>Sunday closed</span></p>
          </div>
          <a href={showroomDirections} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-full border border-amber-300 bg-white px-5 py-2.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-600 hover:text-white">Get directions</a>
        </div>
      </div>
    </div>

    <div className="border-t border-amber-200/70 px-5 py-5">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
        <p>&copy; {new Date().getFullYear()} Annai Jewellery. All rights reserved.</p>
        <p>925 Silver · 24K Gold Plated</p>
      </div>
    </div>
  </footer>
);

export default Footer;
