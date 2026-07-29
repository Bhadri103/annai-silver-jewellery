import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Card, LeadForm, PageHero, Reveal, SEO } from "../components/JewelleryUI";

const contactItems = [
  [MapPin, "Shop No 8, Old Bus Stand, Thucklay, Tamil Nadu 629175"],
  [Phone, "+91 97512 29418"],
  [MessageCircle, "WhatsApp: +91 97512 29418"],
  [Mail, "info@annaijewellery.com"],
  [Clock, "Monday - Saturday: 9:00 AM - 9:00 PM · Sunday: Closed"],
] as const;

const ContactPage = () => (
  <>
    <SEO title="Contact Annai Jewellery" description="Contact Annai Jewellery for 925 silver and 24K gold-plated ornaments, orders and consultations." />
    <PageHero title="Contact Annai Jewellery" text="We are here to help." />
    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal>
          <div className="overflow-hidden rounded-3xl shadow-sm">
            <iframe title="Annai Jewellery Thucklay map" className="h-[420px] w-full border-0" src="https://www.google.com/maps?q=Annai%20Sliver%20Jewellery%2C%20Shop%20No%208%2C%20Old%20Bus%20Stand%2C%20Thucklay%2C%20Tamil%20Nadu%20629175&output=embed" loading="lazy" />
            <div className="grid gap-3 bg-white p-4 sm:grid-cols-2">
              <a href="https://www.google.com/maps/dir//Annai+Sliver+Jewellery,+Shop+No+8,+Old+Bus+Stand,+Thucklay,+Tamil+Nadu+629175/@8.2073794,77.3040963,1915m/data=!3m1!1e3!4m8!4m7!1m0!1m5!1m1!1s0x3b04f9c3ad0b657f:0x9c9047a12495cad7!2m2!1d77.3202801!2d8.2407514?entry=ttu&g_ep=EgoyMDI2MDcyMi4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer" className="rounded-xl border border-amber-200 px-4 py-3 text-center text-sm font-medium text-amber-900 transition hover:bg-amber-50">Showroom Map</a>
              <a href="https://wa.me/919751229418" target="_blank" rel="noreferrer" className="rounded-xl border border-amber-200 px-4 py-3 text-center text-sm font-medium text-amber-900 transition hover:bg-amber-50">Ask for Directions</a>
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
              <a href="tel:+919751229418" className="rounded-xl bg-amber-600 px-4 py-3 text-center text-sm font-medium text-white">Call Now</a>
              <a href="https://wa.me/919751229418" className="rounded-xl border border-amber-500 px-4 py-3 text-center text-sm font-medium text-amber-900">WhatsApp</a>
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
