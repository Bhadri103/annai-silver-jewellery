import React, { useEffect, useState } from "react";
import { Clock, MapPin, Phone, Send } from "lucide-react";
import { websiteApi } from "../lib/api";
import { clean, isPhone, limitPhoneDigits, minLength } from "../lib/validation";

export const Reveal = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <div className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>
);

export const SEO = ({ title, description }: { title: string; description: string }) => {
  useEffect(() => {
    document.title = `${title} | Annai Jewellery`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [title, description]);
  return null;
};

export const PageHero = ({ title, text }: { title: string; text: string }) => (
  <section className="border-b border-amber-100 bg-[#fbf8f1] px-4 py-14 text-center sm:px-6">
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Annai Jewellery</p>
    <h1 className="font-serif text-3xl text-slate-900 sm:text-5xl">{title}</h1>
    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">{text}</p>
  </section>
);

export const SectionTitle = ({ kicker, title, text }: { kicker?: string; title: string; text?: string }) => (
  <div className="mb-8">
    {kicker && <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">{kicker}</p>}
    <h2 className="mt-2 font-serif text-3xl text-slate-900 sm:text-3xl">{title}</h2>
    {/* {text && <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{text}</p>} */}
  </div>
);

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-3xl border border-amber-100 bg-white p-6 shadow-sm ${className}`}>{children}</div>
);

export const LeadForm = () => {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [status, setStatus] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!minLength(form.name, 2) || !isPhone(form.phone)) {
      setStatus("Please enter your name and a valid phone number.");
      return;
    }
    try {
      await websiteApi.createLead({ name: clean(form.name), phone: clean(form.phone), message: clean(form.message), program: "Jewellery enquiry" });
      setStatus("Thank you. The Annai Jewellery team will contact you soon.");
      setForm({ name: "", phone: "", message: "" });
    } catch {
      setStatus("Unable to send your enquiry. Please call +91 97512 29418.");
    }
  };
  return (
    <Card>
      <h2 className="text-2xl font-medium text-slate-900">Jewellery enquiry</h2>
      <p className="mt-2 text-sm text-slate-600">Tell us what you are looking for and our team will assist you.</p>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="rounded-xl border border-amber-200 px-4 py-3 text-sm outline-none focus:border-amber-500" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: limitPhoneDigits(e.target.value) })} placeholder="Phone number" className="rounded-xl border border-amber-200 px-4 py-3 text-sm outline-none focus:border-amber-500" />
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Jewellery type or message" rows={4} className="rounded-xl border border-amber-200 px-4 py-3 text-sm outline-none focus:border-amber-500" />
        <button className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white"><Send className="h-4 w-4" />Send enquiry</button>
        {status && <p className="text-sm text-slate-600">{status}</p>}
      </form>
      <div className="mt-6 grid gap-3 border-t border-amber-100 pt-5 text-xs text-slate-600 sm:grid-cols-3">
        <span className="flex gap-2"><Phone className="h-4 w-4 text-amber-600" />+91 97512 29418</span>
        <span className="flex gap-2"><Clock className="h-4 w-4 text-amber-600" />Mon-Sat, 9 AM-9 PM</span>
        <span className="flex gap-2"><MapPin className="h-4 w-4 text-amber-600" />Thucklay</span>
      </div>
    </Card>
  );
};
