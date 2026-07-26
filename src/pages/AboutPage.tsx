import { Award, Gem, HandHeart, Heart, MapPin, Quote, Scale, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import heroEditorial from "../assets/jewellery/hero-editorial.png";
import templeNecklace from "../assets/jewellery/temple-necklace.png";
import { Card, Reveal, SEO, SectionTitle } from "./highgrade/shared";

const values = [
  {
    icon: ShieldCheck,
    title: "Materials without compromise",
    text: "Every ornament begins with a quality-checked 925 silver base and is carefully finished with 24K gold plating. Materials and pricing are always shared transparently.",
  },
  {
    icon: HandHeart,
    title: "Crafted with patience",
    text: "Our artisans combine time-honoured South Indian techniques with precise modern finishing to create jewellery that feels exceptional from every angle.",
  },
  {
    icon: Heart,
    title: "Relationships for generations",
    text: "We listen before we recommend. From your first gift to your family's bridal jewellery, our service continues long after your purchase.",
  },
  {
    icon: Sparkles,
    title: "Tradition, thoughtfully renewed",
    text: "Temple motifs, antique finishes and contemporary silhouettes come together in collections designed for today and treasured for tomorrow.",
  },
];

const milestones = [
  ["2004", "Annai Jewellery begins as a family-run showroom built on honest pricing and personal service."],
  ["2012", "Our bridal and temple jewellery collections become a trusted choice for families across Tamil Nadu."],
  ["2018", "Our 925 silver and 24K gold-plated everyday collections join the Annai family."],
  ["Today", "More than 50,000 happy customers continue to place their celebrations and memories in our care."],
];

const craftSteps = [
  ["01", "Inspired", "Each design begins with heritage motifs, nature, architecture and the stories our customers bring us."],
  ["02", "Handcrafted", "Experienced silversmiths shape, set and detail every ornament through many hours of patient work."],
  ["03", "Quality checked", "Silver quality, stone setting, plating, finish and weight are checked before a piece receives the Annai seal."],
  ["04", "Cared for", "Simple cleaning and plating-care guidance helps keep your jewellery beautiful for longer."],
];

const reviews = [
  ["Priya S.", "The bridal collection was beautiful and the team patiently helped us find the perfect necklace. The silver and plating details were completely transparent."],
  ["Meena R.", "Annai has been our family's trusted jeweller for years. Their craftsmanship and warm service make every purchase feel special."],
  ["Kavitha M.", "I loved the antique earrings and the finishing was excellent. The staff explained the 925 silver base, gold plating and care instructions clearly."],
  ["Divya K.", "A wonderful range of modern and traditional jewellery. My order was packed safely and delivered exactly when promised."],
  ["Lakshmi V.", "The owner personally made sure our bridal order was completed on time. The attention to every small detail was exceptional."],
  ["Anitha J.", "Beautiful designs, genuine guidance and no pressure to buy. I will definitely return for future family celebrations."],
];

const AboutPage = () => (
  <>
    <SEO title="About Annai Jewellery" description="Discover Annai Jewellery's handcrafted 925 silver ornaments with elegant 24K gold-plated finishes." />
    <section className="relative flex min-h-[calc(100svh-76px)] items-end overflow-hidden">
      <img src={heroEditorial} alt="Annai Jewellery bridal collection" data-eager="true" loading="eager" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover object-[68%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-28 sm:px-8 lg:px-10 lg:pb-28">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600">The Annai Story</p>
          <h1 className="mt-5 text-5xl font-medium leading-[1.05] text-slate-900 sm:text-6xl lg:text-7xl">Jewels of trust.<br/><span className="text-amber-600">Stories for life.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">Annai Jewellery brings together genuine 925 silver, radiant 24K gold plating, South Indian artistry and heartfelt personal service.</p>
          <a href="#our-story" className="mt-8 inline-flex rounded-full bg-amber-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-700">Discover our journey</a>
        </div>
      </div>
    </section>

    <section className="bg-[#fbf8f1] px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <div className="overflow-hidden rounded-[2rem] bg-white p-3 shadow-sm">
            <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=88" alt="Founder and owner of Annai Jewellery" className="h-[480px] w-full rounded-[1.5rem] object-contain" />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-600">Meet Our Founder</p>
          <h2 className="mt-4 text-4xl font-medium leading-tight text-slate-900 sm:text-5xl">A personal promise behind every jewel.</h2>
          <p className="mt-6 text-sm leading-8 text-slate-600">Annai Jewellery was founded with a simple purpose: families should be able to choose precious jewellery with complete confidence. Our owner built the showroom around honest conversations, carefully verified quality and long-term relationships rather than one-time sales.</p>
          <p className="mt-4 text-sm leading-8 text-slate-600">That founding promise remains part of our daily work. From selecting new designs and working alongside artisans to personally supporting important bridal orders, our leadership stays closely involved in every customer experience.</p>
          <div className="mt-7 border-l-2 border-amber-500 pl-5">
            <p className="font-serif text-xl italic leading-8 text-slate-800">&ldquo;Jewellery becomes truly precious when it carries trust, meaning and the happiness of a family.&rdquo;</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Founder, Annai Jewellery</p>
          </div>
        </Reveal>
      </div>
    </section>

    <section id="our-story" className="scroll-mt-24 px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#fbf8f1] p-3 shadow-sm">
            <img src={heroEditorial} alt="Annai Jewellery traditional gold-plated silver bridal collection" className="h-[520px] w-full rounded-[1.5rem] object-contain object-center" />
            <div className="absolute bottom-8 left-8 rounded-2xl border border-white/60 bg-white/90 px-6 py-4 shadow-lg backdrop-blur">
              <strong className="block text-3xl text-amber-600">20+</strong>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-600">Years of trust</span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-600">About Annai Jewels</p>
          <h2 className="mt-4 text-4xl font-medium leading-tight text-amber-900 sm:text-5xl">More than jewellery.<br />A part of your family story.</h2>
          <p className="mt-6 text-sm leading-8 text-slate-600">
            Annai Jewellery began with one enduring belief: buying jewellery should feel as meaningful and reassuring as the occasion it celebrates. What started as a family showroom has grown through the trust of customers who value honest material details, careful gold plating and thoughtful craftsmanship.
          </p>
          <p className="mt-4 text-sm leading-8 text-slate-600">
            Our name, &ldquo;Annai,&rdquo; reflects warmth, care and the quiet strength of a mother. Those qualities guide everything we do&mdash;from welcoming every customer with patience to crafting jewels worthy of being passed from one generation to the next.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 border-y border-amber-200 py-6 text-center">
            <div><strong className="block text-2xl text-amber-600">50K+</strong><span className="text-xs text-slate-500">Happy families</span></div>
            <div><strong className="block text-2xl text-amber-600">925</strong><span className="text-xs text-slate-500">Quality-checked silver</span></div>
            <div><strong className="block text-2xl text-amber-600">25+</strong><span className="text-xs text-slate-500">Skilled artisans</span></div>
          </div>
        </Reveal>
      </div>
    </section>

    <section className="bg-[#fbf8f1] px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionTitle kicker="What We Stand For" title="Our values are set in every jewel." text="Four promises guide every design, recommendation and relationship at Annai." />
        <div className="grid gap-5 md:grid-cols-2">
          {values.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title} delay={index * 70}>
              <Card className="h-full border-amber-100 bg-white">
                <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Icon className="h-6 w-6" /></span>
                <h3 className="text-xl font-medium">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr]">
        <Reveal>
          <div className="relative h-full min-h-[520px] overflow-hidden rounded-[2rem] bg-[#fbf8f1]">
            <img src={templeNecklace} alt="Handcrafted Annai gold-plated silver temple necklace" className="absolute inset-0 h-full w-full object-contain" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-amber-900/70 to-transparent p-8 pt-28 text-white">
              <Gem className="mb-3 h-7 w-7 text-amber-300" />
              <h3 className="text-2xl font-medium">Made slowly. Loved forever.</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/80">A single heirloom can pass through more than twenty pairs of skilled hands before it reaches yours.</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <SectionTitle kicker="From Sketch to Heirloom" title="The art behind every Annai creation." text="Traditional skill and careful quality checks shape each piece at every stage." />
          <div className="grid gap-4 sm:grid-cols-2">
            {craftSteps.map(([number, title, text]) => (
              <Card key={number} className="h-full">
                <span className="text-sm font-semibold text-amber-600">{number}</span>
                <h3 className="mt-3 text-xl font-medium">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    </section>

    <section className="bg-amber-700 px-4 py-16 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-400">Our Journey</p>
          <h2 className="mt-3 text-4xl font-medium">Two decades of meaningful milestones.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {milestones.map(([year, text], index) => (
            <Reveal key={year} delay={index * 70}>
              <div className="h-full rounded-3xl border border-amber-500/20 bg-white/5 p-6">
                <strong className="text-3xl text-amber-400">{year}</strong>
                <p className="mt-4 text-sm leading-7 text-slate-300">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
        {[
          [Scale, "Transparent pricing", "Clear information about the silver base, gold-plated finish, stones and product price."],
          [Award, "Quality-checked materials", "Genuine 925 silver, carefully applied 24K gold plating and selected decorative stones."],
          [Users, "Personal guidance", "Patient experts who help you choose for your style, occasion and budget."],
        ].map(([Icon, title, text]) => (
          <Card key={title as string} className="text-center">
            <Icon className="mx-auto h-8 w-8 text-amber-600" />
            <h3 className="mt-4 text-xl font-medium">{title as string}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{text as string}</p>
          </Card>
        ))}
      </div>
    </section>

    <section className="bg-[#fbf8f1] px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionTitle kicker="Customer Love" title="Stories shared by our customers." text="The trust of families across generations is the most precious part of our journey." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map(([name, review], index) => (
            <Reveal key={name} delay={index * 50}>
              <article className="flex h-full flex-col rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-500">{[0,1,2,3,4].map((star) => <Star key={star} className="h-4 w-4 fill-current" />)}</div>
                  <Quote className="h-7 w-7 text-amber-200" />
                </div>
                <p className="mt-5 flex-1 text-sm leading-7 text-slate-600">&ldquo;{review}&rdquo;</p>
                <div className="mt-6 border-t border-amber-100 pt-4">
                  <strong className="text-sm text-slate-900">{name}</strong>
                  <p className="mt-1 text-xs text-slate-500">Verified Annai customer</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-amber-100 bg-white shadow-lg lg:grid-cols-[0.7fr_1.3fr]">
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><MapPin className="h-6 w-6"/></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-amber-600">Visit Our Showroom</p>
          <h2 className="mt-3 text-3xl font-medium text-slate-900">Experience Annai in person.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">Shop No 8, Old Bus Stand, Padmanabhapuram, Tamil Nadu 629175</p>
          <p className="mt-2 text-sm text-slate-600">Monday–Saturday: 9:00 AM–9:00 PM<br/>Sunday: Closed</p>
          <a href="https://www.google.com/maps/dir//Annai+Sliver+Jewellery,+Shop+No+8,+Old+Bus+Stand,+Padmanabhapuram,+Tamil+Nadu+629175/@8.2073794,77.3040963,1915m/data=!3m1!1e3!4m8!4m7!1m0!1m5!1m1!1s0x3b04f9c3ad0b657f:0x9c9047a12495cad7!2m2!1d77.3202801!2d8.2407514?entry=ttu&g_ep=EgoyMDI2MDcyMi4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer" className="mt-7 inline-flex w-fit rounded-full border border-amber-500 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-amber-600 hover:text-white">Get directions</a>
        </div>
        <div className="min-h-[420px] bg-[#f5efe2]">
          <iframe title="Annai Jewellery showroom location" src="https://www.google.com/maps?q=Annai%20Sliver%20Jewellery%2C%20Shop%20No%208%2C%20Old%20Bus%20Stand%2C%20Padmanabhapuram%2C%20Tamil%20Nadu%20629175&output=embed" className="h-full min-h-[420px] w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
      </div>
    </section>
  </>
);

export default AboutPage;
