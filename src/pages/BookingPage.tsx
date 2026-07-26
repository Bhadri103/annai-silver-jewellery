import { CalendarDays, Check, MessageCircle, Phone } from "lucide-react";
import { Card, LeadForm, PageHero, Reveal, SEO } from "./highgrade/shared";

const BookingPage = () => (
  <>
    <SEO title="Jewellery Consultation" description="Book a personal consultation for Annai Jewellery's 925 silver and 24K gold-plated ornaments." />
    <PageHero title="Book a Jewellery Consultation" text="Get personal help choosing gold-plated silver jewellery for gifts, weddings and special occasions." />
    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
        <LeadForm />
        <Reveal>
          <Card>
            <h2 className="text-xl font-medium">Booking Options</h2>
            {["Personal jewellery consultation", "Bridal ornament selection", "Gift and budget guidance", "Video shopping appointment"].map((item) => (
              <p key={item} className="mt-4 flex gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-amber-600" />
                {item}
              </p>
            ))}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <a href="tel:+919751229418" className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-50"><Phone className="h-4 w-4" /> Call</a>
              <a href="https://wa.me/919751229418" className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-50"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
              <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-medium text-white"><CalendarDays className="h-4 w-4" /> Book</button>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  </>
);

export default BookingPage;
