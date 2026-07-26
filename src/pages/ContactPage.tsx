import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Card, LeadForm, PageHero, Reveal, SEO } from "./highgrade/shared";

const contactItems = [
  [MapPin, "Annai Jewellery, Nagercoil, Tamil Nadu"],
  [Phone, "+91 98943 29507 / 86681698309"],
  [MessageCircle, "WhatsApp: 9894329507"],
  [Mail, "info@annaijewellery.com"],
  [Clock, "Mon - Sat: 10:00 AM - 8:00 PM"],
] as const;

const ContactPage = () => (
  <>
    <SEO title="Contact Annai Jewellery" description="Contact Annai Jewellery for 925 silver and 24K gold-plated ornaments, orders and consultations." />
    <PageHero title="Contact Annai Jewellery" text="Visit, call, WhatsApp, email or book a personal jewellery consultation." />
    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal>
          <div className="overflow-hidden rounded-3xl shadow-sm">
            <iframe title="Annai Jewellery Nagercoil map" className="h-[420px] w-full border-0" src="https://www.google.com/maps?q=Annai%20Jewellery%20Nagercoil&output=embed" loading="lazy" />
            <div className="grid gap-3 bg-white p-4 sm:grid-cols-2">
              <a href="https://www.google.com/maps/search/?api=1&query=Annai+Jewellery+Nagercoil" target="_blank" rel="noreferrer" className="rounded-xl border border-amber-200 px-4 py-3 text-center text-sm font-medium text-amber-900 transition hover:bg-amber-50">Showroom Map</a>
              <a href="https://wa.me/919894329507" target="_blank" rel="noreferrer" className="rounded-xl border border-amber-200 px-4 py-3 text-center text-sm font-medium text-amber-900 transition hover:bg-amber-50">Ask for Directions</a>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <Card>
            <h2 className="text-xl font-medium">Contact Details</h2>
            {contactItems.map(([Icon, text]) => (
              <p key={text} className="mt-5 flex gap-3 text-sm text-slate-600">
                <Icon className="h-5 w-5 text-amber-600" />
                {text}
              </p>
            ))}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a href="tel:+919894329507" className="rounded-xl bg-amber-600 px-4 py-3 text-center text-sm font-medium text-white">Call Now</a>
              <a href="https://wa.me/919894329507" className="rounded-xl border border-amber-500 px-4 py-3 text-center text-sm font-medium text-amber-900">WhatsApp</a>
            </div>
          </Card>
        </Reveal>
      </div>
      <div className="mx-auto mt-8 max-w-3xl">
        <LeadForm />
      </div>
    </section>
  </>
);

export default ContactPage;
